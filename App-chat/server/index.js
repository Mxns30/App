const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();

// React 앱 빌드 파일 서빙
app.use(express.static(path.join(__dirname, '../../build')));

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3015",
    "http://127.0.0.1:3000", 
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3015",
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$/
  ],
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3015",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:3015",
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/,  // 로컬 네트워크 IP 허용
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,   // 로컬 네트워크 IP 허용
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$/  // 로컬 네트워크 IP 허용
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join room", (roomId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId).add(socket.id);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("leave room", (roomId) => {
    socket.leave(roomId);
    if (rooms.has(roomId)) {
      rooms.get(roomId).delete(socket.id);
      if (rooms.get(roomId).size === 0) rooms.delete(roomId);
    }
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  socket.on("chat message", (msg) => {
    socket.to(msg.roomId).emit("chat message", msg);
    console.log(`Message sent to room ${msg.roomId}: ${msg.text}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    rooms.forEach((clients, roomId) => {
      clients.delete(socket.id);
      if (clients.size === 0) rooms.delete(roomId);
    });
  });
});

const PORT = process.env.PORT || 3015;
server.listen(PORT, () => console.log(`Socket server running on port ${PORT}`));
