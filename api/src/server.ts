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

app.use(
  cors({
    origin: ["http://localhost:5173", "https://socket-io-front.vercel.app"],
  })
);

const server = http.createServer(app);

type ServerToClientEvents = {
  "users:count": (count: number) => void;
  "room:message": (msg: ChatMessage) => void;
  "chat:message": (msg: ChatMessage) => void;
};

type ClientToServerEvents = {
  "room:join": (roomId: string) => void;
  "room:leave": (roomId: string) => void;
  "room:message": (data: { room: string; message: string }) => void;
  "chat:message": (msg: string) => void;
};

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: ["http://localhost:5173", "https://socket-io-front.vercel.app"],
  },
});


type ChatMessage = {
  text: string;
  time: string;
  date: string;
  timestamp: Date;
};

const formatMessage = (text: string): ChatMessage => {
  const now = new Date();

  return {
    text,
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

  socket.on("room:join", (roomId) => {
    socket.join(roomId);

    io.to(roomId).emit(
      "room:message",
      formatMessage(`Un utilisateur a rejoint la room`)
    );
  });

  socket.on("room:leave", (roomId) => {
    socket.leave(roomId);

    io.to(roomId).emit(
      "room:message",
      formatMessage(`Un utilisateur a quitté la room`)
    );
  });


  socket.on("room:message", ({ room, message }) => {
    io.to(room).emit("room:message", formatMessage(message));
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