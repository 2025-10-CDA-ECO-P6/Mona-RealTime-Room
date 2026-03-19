import express from "express";
import http from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import {
  createGame,
  startRound,
  submitChoice,
  canResolveRound,
  resolveRound,
  isGameFinished,
  type Game,
  type PlayerChoice,
} from "./game/game";

const app = express();

// TEST API
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://socket-io-front.vercel.app",
  "https://realtime-web.onrender.com",
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : DEFAULT_ALLOWED_ORIGINS;

app.use(
  cors({
    origin: allowedOrigins,
  })
);

const server = http.createServer(app);

type ChatMessage = {
  text: string;
  time: string;
  date: string;
  timestamp: Date;
  author?: string;
};

type RoomStatus = {
  roomId: string;
  count: number;
  status: "empty" | "waiting" | "full";
};

type PlayerRole = "player1" | "player2";

type PublicGameState = {
  game: Game | null;
  players: {
    player1: { socketId: string | null; author?: string };
    player2: { socketId: string | null; author?: string };
  };
};

type ServerToClientEvents = {
  "users:count": (count: number) => void;
  "room:message": (msg: ChatMessage) => void;
  "chat:message": (msg: ChatMessage) => void;
  "rooms:list": (rooms: RoomStatus[]) => void;
  "room:error": (data: { message: string }) => void;
  "room:joined": (data: { roomId: string; role: PlayerRole | null }) => void;

  "game:state": (data: PublicGameState) => void;
  "game:started": (data: PublicGameState) => void;
  "game:round_started": (data: PublicGameState) => void;
  "game:choice_received": (data: {
    player: PlayerRole;
    hasPlayer1Choice: boolean;
    hasPlayer2Choice: boolean;
  }) => void;
  "game:round_resolved": (data: {
    winner: "player1" | "player2" | "egalite";
    game: Game;
  }) => void;
  "game:finished": (data: { game: Game }) => void;
};

type ClientToServerEvents = {
  "rooms:list": () => void;
  "room:join": (data: string | { roomId: string; author?: string }) => void;
  "room:leave": (data: string | { roomId: string; author?: string }) => void;
  "room:message": (data: { room: string; message: string; author?: string }) => void;
  "chat:message": (msg: string) => void;

  "game:choice": (data: { roomId: string; choice: PlayerChoice }) => void;
};

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: allowedOrigins,
  },
});

const formatMessage = (text: string, author?: string): ChatMessage => {
  const now = new Date();

  return {
    text,
    author,
    time: now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    date: now.toLocaleDateString("fr-FR"),
    timestamp: now,
  };
};

const AVAILABLE_ROOMS = [
  "room-1",
  "room-2",
  "room-3",
  "room-4",
  "room-5",
  "room-6",
  "room-7",
  "room-8",
  "room-9",
  "room-10",
] as const;

const isValidRoom = (roomId: string): boolean => {
  return AVAILABLE_ROOMS.includes(roomId as (typeof AVAILABLE_ROOMS)[number]);
};

const getRoomSize = (roomId: string): number => {
  const room = io.sockets.adapter.rooms.get(roomId);
  return room ? room.size : 0;
};

const getRoomsStatus = (): RoomStatus[] => {
  return AVAILABLE_ROOMS.map((roomId) => {
    const count = getRoomSize(roomId);

    let status: "empty" | "waiting" | "full" = "empty";

    if (count === 1) status = "waiting";
    if (count >= 2) status = "full";

    return {
      roomId,
      count,
      status,
    };
  });
};

type RoomGameState = {
  game: Game | null;
  player1: { socketId: string | null; author?: string };
  player2: { socketId: string | null; author?: string };
  resolveTimer: NodeJS.Timeout | null;
};

const roomGames = new Map<string, RoomGameState>();

const getOrCreateRoomGameState = (roomId: string): RoomGameState => {
  const existing = roomGames.get(roomId);

  if (existing) return existing;

  const created: RoomGameState = {
    game: null,
    player1: { socketId: null },
    player2: { socketId: null },
    resolveTimer: null,
  };

  roomGames.set(roomId, created);
  return created;
};

const toPublicGameState = (roomId: string): PublicGameState => {
  const state = getOrCreateRoomGameState(roomId);

  return {
    game: state.game,
    players: {
      player1: {
        socketId: state.player1.socketId,
        author: state.player1.author,
      },
      player2: {
        socketId: state.player2.socketId,
        author: state.player2.author,
      },
    },
  };
};

const getPlayerRoleInRoom = (
  roomId: string,
  socketId: string
): PlayerRole | null => {
  const state = roomGames.get(roomId);
  if (!state) return null;

  if (state.player1.socketId === socketId) return "player1";
  if (state.player2.socketId === socketId) return "player2";

  return null;
};

const clearResolveTimer = (roomId: string): void => {
  const state = roomGames.get(roomId);
  if (!state || !state.resolveTimer) return;

  clearTimeout(state.resolveTimer);
  state.resolveTimer = null;
};

const scheduleRoundResolution = (roomId: string): void => {
  const state = roomGames.get(roomId);
  if (!state || !state.game || !state.game.currentRound) return;

  clearResolveTimer(roomId);

  const delay = Math.max(0, state.game.currentRound.deadlineAt - Date.now());

  state.resolveTimer = setTimeout(() => {
    resolveRoundForRoom(roomId);
  }, delay);
};

const startNextRoundForRoom = (roomId: string): void => {
  const state = roomGames.get(roomId);
  if (!state || !state.game) return;

  try {
    startRound(state.game, Date.now());
    io.to(roomId).emit("game:round_started", toPublicGameState(roomId));
    scheduleRoundResolution(roomId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur au démarrage de la manche";
    io.to(roomId).emit("room:error", { message });
  }
};

const resolveRoundForRoom = (roomId: string): void => {
  const state = roomGames.get(roomId);
  if (!state || !state.game) return;

  try {
    if (!canResolveRound(state.game, Date.now())) {
      return;
    }

    clearResolveTimer(roomId);

    const winner = resolveRound(state.game, Date.now());

    io.to(roomId).emit("game:round_resolved", {
      winner,
      game: state.game,
    });

    if (isGameFinished(state.game)) {
      io.to(roomId).emit("game:finished", {
        game: state.game,
      });
      return;
    }

    setTimeout(() => {
      startNextRoundForRoom(roomId);
    }, 1500);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la résolution";
    io.to(roomId).emit("room:error", { message });
  }
};

const resetRoomGame = (roomId: string): void => {
  clearResolveTimer(roomId);

  const state = getOrCreateRoomGameState(roomId);
  state.game = null;
};

const removePlayerFromRoomState = (roomId: string, socketId: string): void => {
  const state = roomGames.get(roomId);
  if (!state) return;

  if (state.player1.socketId === socketId) {
    state.player1 = { socketId: null };
  }

  if (state.player2.socketId === socketId) {
    state.player2 = { socketId: null };
  }

  if (!state.player1.socketId || !state.player2.socketId) {
    resetRoomGame(roomId);
  }
};

io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log("Connected:", socket.id);

  socket.on("rooms:list", () => {
    socket.emit("rooms:list", getRoomsStatus());
  });

  socket.on("room:join", (data) => {
    const roomId = typeof data === "string" ? data.trim() : data.roomId.trim();
    const author =
      typeof data === "object" && data && "author" in data ? data.author : undefined;

    if (!isValidRoom(roomId)) {
      socket.emit("room:error", {
        message: "Cette room n'existe pas.",
      });
      return;
    }

    const roomSize = getRoomSize(roomId);

    if (roomSize >= 2) {
      socket.emit("room:error", {
        message: `La room ${roomId} est déjà pleine.`,
      });
      return;
    }

    const state = getOrCreateRoomGameState(roomId);

    let role: PlayerRole | null = null;

    if (!state.player1.socketId) {
      state.player1 = { socketId: socket.id, author };
      role = "player1";
    } else if (!state.player2.socketId) {
      state.player2 = { socketId: socket.id, author };
      role = "player2";
    }

    socket.join(roomId);
    socket.emit("room:joined", { roomId, role });

    const text = author
      ? `${author} vient de rejoindre la partie`
      : "Un utilisateur a rejoint la room";

    io.to(roomId).emit("room:message", formatMessage(text, "Système"));
    io.emit("rooms:list", getRoomsStatus());
    io.to(roomId).emit("game:state", toPublicGameState(roomId));

    const bothPlayersReady = state.player1.socketId && state.player2.socketId;

    if (bothPlayersReady && !state.game) {
      state.game = createGame();
      io.to(roomId).emit("game:started", toPublicGameState(roomId));
      startNextRoundForRoom(roomId);
    }
  });

  socket.on("room:leave", (data) => {
    const roomId = typeof data === "string" ? data : data.roomId;
    const author =
      typeof data === "object" && data && "author" in data ? data.author : undefined;

    socket.leave(roomId);
    removePlayerFromRoomState(roomId, socket.id);

    const text = author
      ? `${author} a quitté la partie`
      : "Un utilisateur a quitté la room";

    io.to(roomId).emit("room:message", formatMessage(text, "Système"));
    io.to(roomId).emit("game:state", toPublicGameState(roomId));
    io.emit("rooms:list", getRoomsStatus());
  });

  socket.on("room:message", ({ room, message, author }) => {
    io.to(room).emit("room:message", formatMessage(message, author));
  });

  socket.on("game:choice", ({ roomId, choice }) => {
    const state = roomGames.get(roomId);

    if (!state || !state.game) {
      socket.emit("room:error", {
        message: "Aucune partie active dans cette room.",
      });
      return;
    }

    const role = getPlayerRoleInRoom(roomId, socket.id);

    if (!role) {
      socket.emit("room:error", {
        message: "Vous n'êtes pas un joueur de cette room.",
      });
      return;
    }

    try {
      submitChoice(state.game, role, choice);

      io.to(roomId).emit("game:choice_received", {
        player: role,
        hasPlayer1Choice: state.game.currentRound?.player1Choice !== null,
        hasPlayer2Choice: state.game.currentRound?.player2Choice !== null,
      });

      if (canResolveRound(state.game, Date.now())) {
        resolveRoundForRoom(roomId);
      } else {
        io.to(roomId).emit("game:state", toPublicGameState(roomId));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de l'envoi du choix";

      socket.emit("room:error", { message });
    }
  });

  socket.on("disconnect", () => {
    for (const roomId of AVAILABLE_ROOMS) {
      const role = getPlayerRoleInRoom(roomId, socket.id);

      if (!role) continue;

      removePlayerFromRoomState(roomId, socket.id);

      io.to(roomId).emit(
        "room:message",
        formatMessage("Un joueur s'est déconnecté", "Système")
      );

      io.to(roomId).emit("game:state", toPublicGameState(roomId));
    }

    io.emit("rooms:list", getRoomsStatus());
  });
});

const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});