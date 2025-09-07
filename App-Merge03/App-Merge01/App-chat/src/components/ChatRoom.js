import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { io } from 'socket.io-client';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import PlusButton from './PlusButton';
import DealCompleteModal from './DealCompleteModal';

const ChatRoomContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
`;

const RoomName = styled.h1`
  flex: 1;
  text-align: center;
  font-size: 18px;
  margin: 0;
`;

const OptionButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
`;

const MessageContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f5f5;
`;

function ChatRoom() {
  const [showDealModal, setShowDealModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Socket.IO 연결
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // 메시지 수신
    newSocket.on('receive_message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    return () => newSocket.close();
  }, []);

  const handleSendMessage = (message) => {
    if (socket) {
      const messageData = {
        text: message,
        isMine: true,
        time: new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      socket.emit('send_message', messageData);
      setMessages(prev => [...prev, messageData]);
    }
  };

  const handleDealComplete = () => {
    const dealCompleteMessage = {
      text: 'cloud1234님이 [거래완료]를 눌렀어요!',
      isMine: false,
      time: new Date().toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isDealComplete: true
    };
    setMessages(prev => [...prev, dealCompleteMessage]);
  };

  return (
    <ChatRoomContainer>
      <Header>
        <BackButton>←</BackButton>
        <RoomName>cloud1234</RoomName>
        <OptionButton>⋮</OptionButton>
      </Header>
      
      <MessageContainer>
        {messages.map((msg, index) => (
          <ChatMessage 
            key={index}
            isMine={msg.isMine}
            message={msg.text}
            time={msg.time}
            isDealComplete={msg.isDealComplete}
          />
        ))}
      </MessageContainer>

      <ChatInput onSendMessage={handleSendMessage} />
      <PlusButton onDealClick={() => setShowDealModal(true)} />
      
      {showDealModal && (
        <DealCompleteModal 
          onClose={() => setShowDealModal(false)}
          onDealComplete={handleDealComplete}
        />
      )}
    </ChatRoomContainer>
  );
}

export default ChatRoom;