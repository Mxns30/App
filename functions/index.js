/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

// Firebase Admin 초기화
admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));

// Socket.IO 서버 설정
const io = new Server({
  cors: {
    origin: ["https://chat-test-react-79eac.web.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// 연결된 클라이언트 추적 (채팅방별)
const connectedClients = new Map(); // roomId -> Set of socketIds

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  
  // 사용자가 채팅방에 참여 (기존 방식)
  socket.on("join room", (roomId) => {
    socket.join(roomId);
    
    if (!connectedClients.has(roomId)) {
      connectedClients.set(roomId, new Set());
    }
    connectedClients.get(roomId).add(socket.id);
    
    console.log(`User ${socket.id} joined room: ${roomId}`);
    console.log(`Room ${roomId} has ${connectedClients.get(roomId).size} users`);
    
    // 해당 채팅방의 사용자 수만 브로드캐스트
    io.to(roomId).emit("userCount", connectedClients.get(roomId).size);
  });

  // 친구 프로젝트 방식: join 이벤트
  socket.on("join", (roomId) => {
    socket.join(roomId);
    
    if (!connectedClients.has(roomId)) {
      connectedClients.set(roomId, new Set());
    }
    connectedClients.get(roomId).add(socket.id);
    
    console.log(`User ${socket.id} joined room: ${roomId} (friend's way)`);
    console.log(`Room ${roomId} has ${connectedClients.get(roomId).size} users`);
  });

  // 친구 프로젝트 방식: leave 이벤트
  socket.on("leave", (roomId) => {
    socket.leave(roomId);
    
    if (connectedClients.has(roomId)) {
      connectedClients.get(roomId).delete(socket.id);
      
      if (connectedClients.get(roomId).size === 0) {
        connectedClients.delete(roomId);
        console.log(`Room ${roomId} is now empty and removed`);
      }
    }
    
    console.log(`User ${socket.id} left room: ${roomId} (friend's way)`);
  });

  // 기존 방식: chat message 이벤트
  socket.on("chat message", (msg) => {
    const roomId = msg.roomId;
    
    if (roomId) {
      // 특정 채팅방의 다른 사용자들에게만 메시지 전송
      socket.to(roomId).emit("chat message", msg);
      console.log(`Message sent to room ${roomId}:`, msg.text || msg.image ? 'Image' : 'Text message');
    } else {
      // roomId가 없으면 전체 브로드캐스트 (기존 방식)
      socket.broadcast.emit("chat message", msg);
    }
  });

  // 친구 프로젝트 방식: message 이벤트
  socket.on("message", (msg) => {
    const roomId = msg.roomId;
    
    if (roomId) {
      // 특정 채팅방의 다른 사용자들에게만 메시지 전송
      socket.to(roomId).emit("message", msg);
      console.log(`Text message sent to room ${roomId}:`, msg.text);
    } else {
      // roomId가 없으면 전체 브로드캐스트
      socket.broadcast.emit("message", msg);
    }
  });

  // 친구 프로젝트 방식: image 이벤트
  socket.on("image", (imgMsg) => {
    const roomId = imgMsg.roomId;
    
    if (roomId) {
      // 특정 채팅방의 다른 사용자들에게만 이미지 전송
      socket.to(roomId).emit("image", imgMsg);
      console.log(`Image sent to room ${roomId}`);
    } else {
      // roomId가 없으면 전체 브로드캐스트
      socket.broadcast.emit("image", imgMsg);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    // 모든 채팅방에서 사용자 제거
    for (const [roomId, clients] of connectedClients.entries()) {
      if (clients.has(socket.id)) {
        clients.delete(socket.id);
        console.log(`User ${socket.id} left room: ${roomId}`);
        
        // 채팅방이 비어있으면 제거
        if (clients.size === 0) {
          connectedClients.delete(roomId);
          console.log(`Room ${roomId} is now empty and removed`);
        } else {
          // 해당 채팅방의 사용자 수 업데이트
          io.to(roomId).emit("userCount", clients.size);
        }
      }
    }
  });
});

// HTTP 엔드포인트로 Socket.IO 연결
app.get("/", (req, res) => {
  res.send("Chat server is running!");
});

// Socket.IO를 HTTP 서버에 연결
const server = app.listen(0, () => {
  console.log("Chat server running on Firebase Functions");
});

io.attach(server);

// Firebase Functions로 내보내기
exports.chatServer = functions.https.onRequest(app);
