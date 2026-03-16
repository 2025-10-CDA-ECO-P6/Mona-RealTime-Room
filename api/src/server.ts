import express from "express";
import http from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
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
};

type ClientToServerEvents = {
  "room:join": (data: string | { roomId: string; author?: string }) => void;
  "room:leave": (data: string | { roomId: string; author?: string }) => void;
  "room:message": (data: { room: string; message: string; author?: string }) => void;
  "chat:message": (msg: string) => void;
};

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: allowedOrigins,
  },
});


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


app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});



io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log("Connected:", socket.id);

  socket.on("room:join", (data) => {
    const roomId = typeof data === 'string' ? data : data.roomId
    const author = typeof data === 'object' && data && 'author' in data ? data.author : undefined

    socket.join(roomId)

    const text = author ? `${author} vient de rejoindre la partie` : `Un utilisateur a rejoint la room`

    io.to(roomId).emit(
      "room:message",
      formatMessage(text, 'Système')
    )
  })

  socket.on("room:leave", (data) => {
    const roomId = typeof data === 'string' ? data : data.roomId
    const author = typeof data === 'object' && data && 'author' in data ? data.author : undefined

    socket.leave(roomId)

    const text = author ? `${author} a quitté la partie` : `Un utilisateur a quitté la room`

    io.to(roomId).emit(
      "room:message",
      formatMessage(text, 'Système')
    )
  })


  socket.on("room:message", ({ room, message, author }) => {
    io.to(room).emit("room:message", formatMessage(message, author));
  });

  // socket.on("chat:message", (msg) => {
  //   io.emit("chat:message", formatMessage(msg));
  // });

  // socket.on("disconnect", () => {
  //   connectedUsers--;
  //   io.emit("users:count", connectedUsers);
  // });
});

server.listen(3000, () => {
  console.log("API running on port 3000");
});