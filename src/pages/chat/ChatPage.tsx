import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Firebase import 제거 (로컬 저장소 사용)
import io from 'socket.io-client';
import ChatInput from '../../components/chat/ChatInput';
import ChatMessageList from '../../components/chat/ChatMessageList';
import DealCompleteModal from '../../components/chat/DealCompleteModal';

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:3001'  // 임시로 로컬 서버 사용
  : 'http://localhost:3001';

interface Message {
  id?: string;
  type: string;
  text?: string;
  image?: string;
  time: string;
  timestamp: Date;
  userId: string;
  sender: string;
}

const ChatPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const postId = searchParams.get('postId');
  const sellerId = searchParams.get('sellerId');
  const postTitle = searchParams.get('postTitle');
  
  console.log('=== ChatPage URL 파라미터 확인 ===');
  console.log('postId:', postId);
  console.log('sellerId:', sellerId);
  console.log('postTitle:', postTitle);
  console.log('전체 URL:', window.location.href);
  console.log('search params:', window.location.search);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId] = useState(() => {
    const stored = localStorage.getItem('userId');
    if (stored) {
      console.log('ChatPage - 저장된 사용자 ID 사용:', stored);
      return stored;
    } else {
      // 로그인하지 않은 경우 기본 ID 생성
      const newId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', newId);
      console.log('ChatPage - 새 게스트 ID 생성:', newId);
      return newId;
    }
  });
  const [socket, setSocket] = useState<any>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // userId가 없으면 저장
  useEffect(() => {
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userId);
    }
  }, [userId]);

  // roomId가 없으면 채팅 목록으로 리다이렉트
  useEffect(() => {
    if (!roomId) {
      navigate('/chat');
    }
  }, [roomId, navigate]);

  // Socket.IO 연결
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO 연결됨');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO 연결 해제됨');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // 채팅방에 참여
  useEffect(() => {
    if (socket && roomId) {
      socket.emit('join room', roomId);
      console.log('채팅방 참여 요청:', roomId);
    }
  }, [socket, roomId]);

  // 채팅방 생성 또는 확인 (로컬 저장소 사용)
  useEffect(() => {
    const createOrJoinRoom = () => {
      console.log('=== createOrJoinRoom 함수 호출 ===');
      console.log('roomId:', roomId);
      console.log('userId:', userId);
      console.log('postId:', postId);
      console.log('sellerId:', sellerId);
      console.log('postTitle:', postTitle);
      
      if (!roomId || !userId) {
        console.log('roomId 또는 userId가 없어서 함수 종료');
        return;
      }
      
      try {
        // 로컬 저장소에서 채팅방 목록 가져오기
        const existingRooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
        const existingRoom = existingRooms.find((room: any) => room.id === roomId);
        
        if (!existingRoom) {
          // 새 채팅방 생성
          const participants = [userId];
          
          // 게시물 정보가 있으면 판매자도 참여자에 추가
          if (postId && sellerId && !participants.includes(sellerId)) {
            participants.push(sellerId);
          }
          
          console.log('=== 게시물 기반 채팅방 생성 (로컬 저장소) ===');
          console.log('채팅방 ID:', roomId);
          console.log('사용자 ID:', userId);
          console.log('게시물 ID:', postId);
          console.log('판매자 ID:', sellerId);
          console.log('참여자 목록:', participants);
          
          const roomData: any = {
            id: roomId,
            createdAt: new Date().toISOString(),
            participants: participants,
            lastMessage: null,
            updatedAt: new Date().toISOString(),
            createdBy: userId,
            status: 'active',
            messages: [] // 메시지 배열 추가
          };

          // 게시물 정보가 있으면 추가
          if (postId && sellerId) {
            roomData.postId = postId;
            roomData.sellerId = sellerId;
            roomData.buyerId = userId;
            roomData.type = 'post_chat';
            // 게시물 제목이 있으면 저장
            if (postTitle) {
              roomData.postTitle = postTitle;
              console.log('postTitle 저장됨:', postTitle);
            } else {
              console.log('postTitle이 없음, 기본값 설정');
              roomData.postTitle = `게시물 ${postId}`;
            }
          } else {
            roomData.type = 'general_chat';
          }

          // 로컬 저장소에 채팅방 저장
          const updatedRooms = [...existingRooms, roomData];
          localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));
          
          console.log('채팅방 데이터:', roomData);
          console.log('채팅방 생성 완료, 로컬 저장소에 저장됨');
          console.log('=== 채팅방 생성 완료 ===');
        } else {
          // 기존 채팅방에 참여자 추가 (중복 방지)
          const currentParticipants = existingRoom.participants || [];
          let roomUpdated = false;
          let updatedRoom = { ...existingRoom };
          
          if (!currentParticipants.includes(userId)) {
            const updatedParticipants = [...currentParticipants, userId];
            updatedRoom = {
              ...existingRoom,
              participants: updatedParticipants,
              updatedAt: new Date().toISOString()
            };
            roomUpdated = true;
            console.log('기존 채팅방에 참여자 추가:', roomId, updatedParticipants);
          } else {
            console.log('이미 참여 중인 채팅방:', roomId);
          }
          
          // postTitle이 없으면 추가
          if (postId && postTitle && !existingRoom.postTitle) {
            updatedRoom.postTitle = postTitle;
            roomUpdated = true;
            console.log('기존 채팅방에 postTitle 추가:', postTitle);
          }
          
          if (roomUpdated) {
            const updatedRooms = existingRooms.map((room: any) => 
              room.id === roomId ? updatedRoom : room
            );
            localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));
            console.log('기존 채팅방 업데이트 완료');
          }
        }
      } catch (error) {
        console.error('채팅방 생성/참여 중 에러:', error);
      }
    };

    if (roomId && userId) {
      createOrJoinRoom();
    }
  }, [roomId, userId, postId, sellerId, postTitle]);

  // 로컬 저장소에서 메시지 불러오기
  useEffect(() => {
    if (!roomId) return;

    try {
      // 로컬 저장소에서 채팅방 목록 가져오기
      const existingRooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
      const currentRoom = existingRooms.find((room: any) => room.id === roomId);
      
      if (currentRoom && currentRoom.messages) {
        const messageList = currentRoom.messages.map((msg: any) => ({
          id: msg.id || Date.now().toString(),
          ...msg,
          userId: msg.userId || 'unknown',
          sender: msg.userId === userId ? 'me' : 'other'
        } as Message));
        setMessages(messageList);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('메시지 불러오기 실패:', error);
      setMessages([]);
    }
  }, [roomId, userId]);

  // 새 메시지가 올 때 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송 (로컬 저장소 사용)
  const handleSend = (text: string) => {
    if (!text || !roomId) return;
    
    try {
      const msg = {
        id: Date.now().toString(),
        type: 'text',
        text: text,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(),
        userId: userId,
        sender: 'me'
      };
      
      // 로컬 저장소에 메시지 저장
      const existingRooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
      const updatedRooms = existingRooms.map((room: any) => {
        if (room.id === roomId) {
          return {
            ...room,
            messages: [...(room.messages || []), msg],
            lastMessage: { text: text, timestamp: new Date() },
            updatedAt: new Date().toISOString()
          };
        }
        return room;
      });
      localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));
      
      // 메시지 목록 업데이트
      setMessages(prev => [...prev, msg as Message]);
      
      // Socket.IO로 메시지 전송 (선택사항)
      if (socket) {
        socket.emit("chat message", { ...msg, roomId });
      }
    } catch (error) {
      console.error('메시지 전송 중 에러 발생:', error);
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 이미지 전송 (로컬 저장소 사용)
  const handleSendImage = (url: string) => {
    if (!url || !roomId) {
      console.error('이미지 URL이 없습니다.');
      return;
    }
    
    try {
      const msg = {
        id: Date.now().toString(),
        type: 'image',
        image: url,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(),
        userId: userId,
        sender: 'me'
      };
      
      // 로컬 저장소에 이미지 메시지 저장
      const existingRooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
      const updatedRooms = existingRooms.map((room: any) => {
        if (room.id === roomId) {
          return {
            ...room,
            messages: [...(room.messages || []), msg],
            lastMessage: { text: '[이미지]', timestamp: new Date() },
            updatedAt: new Date().toISOString()
          };
        }
        return room;
      });
      localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));
      
      // 메시지 목록 업데이트
      setMessages(prev => [...prev, msg as Message]);
      
      // Socket.IO로 메시지 전송 (선택사항)
      if (socket) {
        socket.emit("chat message", { ...msg, roomId });
      }
    } catch (error) {
      console.error('이미지 메시지 전송 중 에러 발생:', error);
      alert('이미지 전송에 실패했습니다.');
    }
  };

  // 거래완료 처리 (로컬 저장소 사용)
  const handleDealComplete = () => {
    if (!roomId) return;
    
    try {
      const dealCompleteMsg = {
        id: Date.now().toString(),
        type: 'dealComplete',
        text: `${userId}님이 [거래완료]를 눌렀어요!`,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(),
        userId: userId,
        sender: 'other'
      };
      
      // 로컬 저장소에 거래완료 메시지 저장
      const existingRooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
      const updatedRooms = existingRooms.map((room: any) => {
        if (room.id === roomId) {
          return {
            ...room,
            messages: [...(room.messages || []), dealCompleteMsg],
            lastMessage: { text: '[거래완료]', timestamp: new Date() },
            updatedAt: new Date().toISOString()
          };
        }
        return room;
      });
      localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));
      
      // 메시지 목록 업데이트
      setMessages(prev => [...prev, dealCompleteMsg as Message]);
      
      setTimeout(() => {
        alert('거래가 완료되었습니다!');
      }, 100);
    } catch (error) {
      console.error('거래완료 메시지 저장 중 에러:', error);
      alert('거래가 완료되었습니다!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>
      {/* 상단 바 */}
      <div style={{ 
        height: 56, 
        display: 'flex', 
        alignItems: 'center', 
        borderBottom: '1px solid #eee', 
        padding: '0 16px', 
        fontWeight: 700, 
        fontSize: 20, 
        justifyContent: 'space-between',
        backgroundColor: '#fff'
      }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: '#75757C',
            fontWeight: 'bold'
          }}
        >
          &lt;
        </button>
                 <div>
           {postId ? (
             <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                 {postTitle || `게시물 ${postId} 채팅`}
               </div>
               <div style={{ fontSize: '12px', color: '#666' }}>
                 판매자: {sellerId}
               </div>
             </div>
           ) : (
             `채팅방: ${roomId?.slice(0, 8)}...`
           )}
         </div>
        <div style={{ width: '60px' }}></div>
      </div>
      
      {/* 메시지 리스트 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        <ChatMessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>
      
      {/* 입력창 */}
      <ChatInput onSend={handleSend} onSendImage={handleSendImage} onDealComplete={() => setShowDealModal(true)} />
      
      {/* 거래완료 모달 */}
      {showDealModal && (
        <DealCompleteModal 
          onClose={() => setShowDealModal(false)} 
          onDealComplete={handleDealComplete}
        />
      )}
    </div>
  );
};

export default ChatPage;
