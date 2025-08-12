const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: ["http://localhost:3000", "https://chat-test-react-79eac.web.app"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// 연결된 클라이언트 추적
const connectedClients = new Set();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  connectedClients.add(socket.id);
  
  // 연결된 클라이언트 수 브로드캐스트
  io.emit("userCount", connectedClients.size);

  socket.on("chat message", (msg) => {
    // 메시지를 보낸 클라이언트를 제외한 모든 클라이언트에게 전송
    socket.broadcast.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    connectedClients.delete(socket.id);
    io.emit("userCount", connectedClients.size);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});