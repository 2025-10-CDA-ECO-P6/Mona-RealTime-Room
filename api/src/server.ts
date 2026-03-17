import express from "express";
import http from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

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

type ServerToClientEvents = {
  "users:count": (count: number) => void;
  "room:message": (msg: ChatMessage) => void;
  "chat:message": (msg: ChatMessage) => void;
  "rooms:list": (rooms: RoomStatus[]) => void;
  "room:error": (data: { message: string }) => void;
  "room:joined": (data: { roomId: string }) => void;
};

type ClientToServerEvents = {
  "rooms:list": () => void;
  "room:join": (data: string | { roomId: string; author?: string }) => void;
  "room:leave": (data: string | { roomId: string; author?: string }) => void;
  "room:message": (data: { room: string; message: string; author?: string }) => void;
  "chat:message": (msg: string) => void;
};


const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: DEFAULT_ALLOWED_ORIGINS,
  },
})


type ChatMessage = {
  text: string;
  time: string;
  date: string;
  timestamp: Date;
  author?: string;
};

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
  'room-1',
  'room-2',
  'room-3',
  'room-4',
  'room-5',
  'room-6',
  'room-7',
  'room-8',
  'room-9',
  'room-10',
] as const

const isValidRoom = (roomId: string): boolean => {
  return AVAILABLE_ROOMS.includes(roomId as typeof AVAILABLE_ROOMS[number])
}

const getRoomSize = (roomId: string): number => {
  const room = io.sockets.adapter.rooms.get(roomId)
  return room ? room.size : 0
}

type RoomStatus = {
  roomId: string
  count: number
  status: 'empty' | 'waiting' | 'full'
}

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

io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log("Connected:", socket.id);
  socket.on("rooms:list", () => {
    console.log("rooms:list demandé par", socket.id)
    const rooms = getRoomsStatus()
    console.log("rooms envoyées :", rooms)
    socket.emit("rooms:list", rooms)
  })

  socket.on("room:join", (data) => {
    const roomId = typeof data === 'string' ? data.trim() : data.roomId.trim();
    const author =
      typeof data === 'object' && data && 'author' in data ? data.author : undefined;

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

    socket.join(roomId);

    socket.emit("room:joined", { roomId });

    const text = author
      ? `${author} vient de rejoindre la partie`
      : `Un utilisateur a rejoint la room`;

    io.to(roomId).emit("room:message", formatMessage(text, "Système"));
    io.emit("rooms:list", getRoomsStatus());
  });

  socket.on("room:leave", (data) => {
    const roomId = typeof data === 'string' ? data : data.roomId;
    const author =
      typeof data === 'object' && data && 'author' in data ? data.author : undefined;

    socket.leave(roomId);

    const text = author
      ? `${author} a quitté la partie`
      : `Un utilisateur a quitté la room`;

    io.to(roomId).emit("room:message", formatMessage(text, 'Système'));
    io.emit("rooms:list", getRoomsStatus());
  });

  socket.on("room:message", ({ room, message, author }) => {
    io.to(room).emit("room:message", formatMessage(message, author));
  });

  socket.on("disconnect", () => {
    io.emit("rooms:list", getRoomsStatus());
  });
});

const PORT = Number(process.env.PORT) || 3000

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT}`)
})