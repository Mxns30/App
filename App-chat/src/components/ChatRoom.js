import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { io } from 'socket.io-client';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import PlusButton from './PlusButton';
import DealCompleteModal from './DealCompleteModal';

const ChatRoomContainer = styled.div`...`; // 기존 스타일 유지
const Header = styled.div`...`;
const BackButton = styled.button`...`;
const RoomName = styled.h1`...`;
const OptionButton = styled.button`...`;
const MessageContainer = styled.div`...`;

function ChatRoom({ roomId }) {
  const [showDealModal, setShowDealModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('https://your-server.com'); // 서버 배포 URL
    setSocket(newSocket);

    // 방 참여
    newSocket.emit('join', roomId);

    // 메시지 수신
    newSocket.on('message', (data) => setMessages(prev => [...prev, data]));
    newSocket.on('image', (data) => setMessages(prev => [...prev, data]));

    return () => {
      newSocket.emit('leave', roomId);
      newSocket.close();
    };
  }, [roomId]);

  const handleSendMessage = (message) => {
    if (!socket) return;
    const msgData = {
      roomId,
      text: message,
      isMine: true,
      time: new Date().toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })
    };
    socket.emit('message', msgData);
    setMessages(prev => [...prev, msgData]);
  };

  const handleDealComplete = () => {
    const msgData = {
      roomId,
      text: '[거래완료]',
      isMine: false,
      time: new Date().toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' }),
      isDealComplete: true
    };
    socket.emit('message', msgData);
    setMessages(prev => [...prev, msgData]);
  };

  return (
    <ChatRoomContainer>
      <Header>
        <BackButton>←</BackButton>
        <RoomName>{roomId}</RoomName>
        <OptionButton>⋮</OptionButton>
      </Header>
      <MessageContainer>
        {messages.map((msg,i) => (
          <ChatMessage key={i} {...msg} />
        ))}
      </MessageContainer>
      <ChatInput onSendMessage={handleSendMessage} />
      <PlusButton onDealClick={()=>setShowDealModal(true)} />
      {showDealModal && <DealCompleteModal onClose={()=>setShowDealModal(false)} onDealComplete={handleDealComplete} />}
    </ChatRoomContainer>
  );
}

export default ChatRoom;
