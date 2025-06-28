import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import io from 'socket.io-client';
import ChatInput from './components/ChatInput';

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://chat-test-react-79eac.web.app'  // Firebase 호스팅 URL
  : 'http://localhost:3001';

const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  transports: ['websocket', 'polling']
});

// 전체 컨테이너
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh; /* 모바일에서 동적 viewport 높이 사용 */
  background: #fff;
  overflow: hidden;
`;

// 헤더
const Header = styled.div`
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  flex-shrink: 0;
`;

// 메시지 영역
const MessageContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f5f5;
`;

// 메시지 스타일
const MessageItem = styled.div`
  margin: 8px 0;
  text-align: ${props => props.isMe ? 'right' : 'left'};
`;

const MessageText = styled.span`
  background: ${props => props.isMe ? '#E6FAEC' : '#fff'};
  padding: 8px 12px;
  border-radius: 12px;
  display: inline-block;
  max-width: 70%;
  word-break: break-word;
`;

const MessageImage = styled.img`
  max-width: 200px;
  border-radius: 8px;
  display: block;
  margin: 4px 0;
`;

const MessageTime = styled.div`
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
`;

// 모달 스타일 컴포넌트
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  width: 80%;
  max-width: 300px;
  text-align: center;
`;

const ModalTitle = styled.h2`
  margin-bottom: 20px;
  font-size: 18px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;

const Button = styled.button`
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: ${props => props.isYes ? '#E6FAEC' : '#f5f5f5'};
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: ${props => props.isYes ? '#d4f5dc' : '#e0e0e0'};
  }
`;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId] = useState(() => localStorage.getItem('userId') || Date.now().toString());
  const [isConnected] = useState(socket.connected);
  const [showDealModal, setShowDealModal] = useState(false);
  const messagesEndRef = useRef(null);

  // userId가 없으면 저장
  useEffect(() => {
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userId);
    }
  }, [userId]);

  // Socket.IO 메시지 수신 처리
  useEffect(() => {
    socket.on('chat message', (msg) => {
      // Firebase에서 메시지가 이미 저장되어 있으므로, 
      // onSnapshot에서 자동으로 업데이트될 것입니다.
      console.log('메시지 수신:', msg);
    });

    return () => {
      socket.off('chat message');
    };
  }, []);

  // Firebase에서 메시지 불러오기
  useEffect(() => {
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isMe: doc.data().userId === userId
      }));
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [userId]);

  // 새 메시지가 올 때 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송
  const sendMessage = async (text) => {
    // text 파라미터로 받음 (ChatInput에서 전달)
    if (!text.trim()) return;
    
    try {
      const msg = {
        text: text,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        type: "text",
        timestamp: new Date(),
        userId: userId
      };
      
      // Firebase에 메시지 저장
      const docRef = await addDoc(collection(db, "messages"), msg);
      
      // Socket.IO로 메시지 전송 (Firebase 저장 후)
      if (isConnected) {
        socket.emit("chat message", { ...msg, id: docRef.id });
      }
    } catch (error) {
      console.error('메시지 전송 중 에러 발생:', error);
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 이미지 전송
  const sendImage = async (url) => {
    // url: firebase storage에서 받은 이미지 url
    console.log('sendImage 함수 호출됨, URL:', url);
    if (!url) {
      console.error('이미지 URL이 없습니다.');
      return;
    }
    
    try {
      const msg = {
        image: url,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        type: "image",
        timestamp: new Date(),
        userId: userId
      };
      console.log('이미지 메시지 생성:', msg);
      
      // Firebase에 이미지 메시지 저장
      const docRef = await addDoc(collection(db, "messages"), msg);
      console.log('Firebase에 이미지 메시지 저장 완료:', docRef.id);
      
      // Socket.IO로 메시지 전송 (Firebase 저장 후)
      if (isConnected) {
        socket.emit("chat message", { ...msg, id: docRef.id });
        console.log('Socket.IO로 이미지 메시지 전송 완료');
      }
    } catch (error) {
      console.error('이미지 메시지 전송 중 에러 발생:', error);
      alert('이미지 전송에 실패했습니다.');
    }
  };

  // 거래완료 버튼 클릭 시
  const handleDealComplete = () => {
    setShowDealModal(true);
  };

  // 거래완료 확인
  const handleDealConfirm = () => {
    setShowDealModal(false);
    setTimeout(() => {
      alert('거래가 완료되었습니다!');
    }, 100);
  };

  // 거래완료 취소
  const handleDealCancel = () => {
    setShowDealModal(false);
  };

  return (
    <AppContainer>
      <Header>채팅</Header>
      <MessageContainer>
        {messages.map(msg => (
          <MessageItem key={msg.id} isMe={msg.isMe}>
            {msg.type === 'text' ? (
              <MessageText isMe={msg.isMe}>{msg.text}</MessageText>
            ) : (
              <MessageImage src={msg.image} alt="전송된 이미지" />
            )}
            <MessageTime>{msg.time}</MessageTime>
          </MessageItem>
        ))}
        <div ref={messagesEndRef} />
      </MessageContainer>
      <ChatInput
        onSend={sendMessage}
        onSendImage={sendImage}
        onDealComplete={handleDealComplete}
      />
      {showDealModal && (
        <ModalOverlay onClick={handleDealCancel}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>거래를 완료하시겠습니까?</ModalTitle>
            <ButtonContainer>
              <Button isYes={true} onClick={handleDealConfirm}>Yes</Button>
              <Button isYes={false} onClick={handleDealCancel}>No</Button>
            </ButtonContainer>
          </ModalContent>
        </ModalOverlay>
      )}
    </AppContainer>
  );
}