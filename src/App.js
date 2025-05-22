import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import io from 'socket.io-client';

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://chat-test-react-79eac.web.app'  // 프로덕션 URL
  : 'http://localhost:3001';  // 개발 환경 URL

const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
});

const InputArea = styled.div`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 400px;
  display: flex;
  background: #f7f7f7;
  padding: 8px 16px;
  box-sizing: border-box;
  z-index: 10;
`;

const MenuButton = styled.button`
  background: ${({ color }) => color || "#eee"};
  border: none;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #333;
  margin: 0 8px;
  cursor: pointer;
  font-weight: bold;
  position: relative;
  white-space: pre-line;
  line-height: 1.2;
  padding: 6px 0 0 0;
  word-break: keep-all;
`;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const fileInputRef = useRef();
  const [userId] = useState(() => localStorage.getItem('userId') || Date.now().toString());

  // userId가 없으면 저장
  useEffect(() => {
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userId);
    }
  }, [userId]);

  // Socket.IO 연결 상태 관리
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket.IO 연결됨');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket.IO 연결 끊김');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO 연결 에러:', error);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, []);

  // Firebase에서 메시지 불러오기
  useEffect(() => {
    const fetchMessages = async () => {
      const messagesRef = collection(db, "messages");
      const q = query(messagesRef, orderBy("timestamp", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messageList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isMe: doc.data().userId === userId // 현재 사용자의 메시지인지 확인
        }));
        setMessages(messageList);
      });
      return unsubscribe;
    };

    fetchMessages();
  }, [userId]);

  // 메시지 전송
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    try {
      const msg = {
        id: Date.now(),
        text: input,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        type: "text",
        timestamp: new Date(),
        userId: userId
      };
      
      // Firebase에 메시지 저장
      await addDoc(collection(db, "messages"), msg);
      
      // Socket.IO 연결 상태 확인 후 메시지 전송
      if (isConnected) {
        socket.emit("chat message", msg);
      } else {
        console.warn('Socket.IO가 연결되어 있지 않습니다.');
      }
      
      setInput("");
    } catch (error) {
      console.error('메시지 전송 중 에러 발생:', error);
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 이미지 전송
  const sendImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const msg = {
        id: Date.now(),
        image: reader.result,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        type: "image",
        timestamp: new Date(),
        userId: userId // 사용자 ID 추가
      };
      
      // Firebase에 이미지 메시지 저장
      await addDoc(collection(db, "messages"), msg);
      socket.emit("chat message", msg);
    };
    reader.readAsDataURL(file);
  };

  // ... rest of the code ...
}