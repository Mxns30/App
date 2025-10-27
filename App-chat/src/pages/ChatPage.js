import React, { useEffect, useRef, useState } from 'react';
import socket from '../socket';
import ChatInput from '../components/ChatInput';
import ChatMessageList from '../components/ChatMessageList';
import DealCompleteModal from '../components/DealCompleteModal';
import { useParams } from 'react-router-dom';

function ChatPage() {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [showDealModal, setShowDealModal] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit('join', roomId);
    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on('image', (imgMsg) => {
      setMessages((prev) => [...prev, imgMsg]);
    });
    return () => {
      socket.off('message');
      socket.off('image');
      socket.emit('leave', roomId);
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text) => {
    if (!text) return;
    const msg = { type: 'text', text, time: new Date().toLocaleTimeString(), sender: 'me' };
    setMessages((prev) => [...prev, msg]);
    socket.emit('message', { ...msg, roomId });
  };

  const handleSendImage = (url) => {
    const imgMsg = { type: 'image', image: url, time: new Date().toLocaleTimeString(), sender: 'me' };
    setMessages((prev) => [...prev, imgMsg]);
    socket.emit('image', { ...imgMsg, roomId });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>
      {/* 상단 바 */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', padding: '0 16px', fontWeight: 700, fontSize: 20, justifyContent: 'center' }}>
        {roomId}
      </div>
      {/* 메시지 리스트 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        <ChatMessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>
      {/* 입력창 */}
      <ChatInput onSend={handleSend} onSendImage={handleSendImage} onDealComplete={() => setShowDealModal(true)} />
      {/* 거래완료 모달 */}
      {showDealModal && <DealCompleteModal onClose={() => setShowDealModal(false)} />}
    </div>
  );
}

export default ChatPage; 