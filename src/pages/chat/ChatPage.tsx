import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from '../../config/firebase.ts';
import io from 'socket.io-client';
import ChatInput from '../../components/chat/ChatInput.tsx';
import ChatMessageList from '../../components/chat/ChatMessageList.tsx';
import DealCompleteModal from '../../components/chat/DealCompleteModal.tsx';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId] = useState(() => {
    const stored = localStorage.getItem('userId');
    if (stored) {
      return stored;
    } else {
      const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', newId);
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

  // 채팅방 생성 또는 확인
  useEffect(() => {
    const createOrJoinRoom = async () => {
      if (!roomId || !userId) return;
      
      try {
        // 네트워크 연결 강제 활성화
        await enableNetwork(db);
        
        const roomRef = doc(db, "chatRooms", roomId);
        const roomDoc = await getDoc(roomRef);
        
        if (!roomDoc.exists()) {
          // 새 채팅방 생성
          const participants = [userId];
          
          // 게시물 정보가 있으면 판매자도 참여자에 추가
          if (postId && sellerId && !participants.includes(sellerId)) {
            participants.push(sellerId);
          }
          
          const roomData: any = {
            createdAt: serverTimestamp(),
            participants: participants,
            lastMessage: null,
            updatedAt: serverTimestamp(),
            // 추가 메타데이터
            createdBy: userId,
            status: 'active'
          };

          // 게시물 정보가 있으면 추가
          if (postId && sellerId) {
            roomData.postId = postId;
            roomData.sellerId = sellerId;
            roomData.buyerId = userId;
            roomData.type = 'post_chat';
          } else {
            roomData.type = 'general_chat';
          }

          await setDoc(roomRef, roomData);
          console.log('새 채팅방 생성됨:', roomId, roomData);
          console.log('참여자 목록:', participants);
          
          // 채팅방 생성 후 잠시 대기하여 Firebase에 완전히 저장되도록 함
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log('채팅방 생성 완료, Firebase에 저장됨');
          
          // 채팅방 생성 완료 후 목록 페이지로 리다이렉트
          console.log('채팅방 생성 완료, 목록 페이지로 이동');
          navigate('/chat');
        } else {
          // 기존 채팅방에 참여자 추가 (중복 방지)
          const roomData = roomDoc.data();
          const currentParticipants = roomData.participants || [];
          
          if (!currentParticipants.includes(userId)) {
            const updatedParticipants = [...currentParticipants, userId];
            await setDoc(roomRef, {
              ...roomData,
              participants: updatedParticipants,
              updatedAt: serverTimestamp()
            }, { merge: true });
            console.log('기존 채팅방에 참여자 추가:', roomId, updatedParticipants);
          } else {
            console.log('이미 참여 중인 채팅방:', roomId);
          }
        }
      } catch (error) {
        console.error('채팅방 생성/참여 중 에러:', error);
      }
    };

    if (roomId && userId) {
      createOrJoinRoom();
    }
  }, [roomId, userId, postId, sellerId]);

  // Firebase에서 메시지 불러오기
  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          userId: data.userId || 'unknown', // userId가 없으면 기본값 설정
          sender: data.userId === userId ? 'me' : 'other'
        } as Message;
      });
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [roomId, userId]);

  // 새 메시지가 올 때 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송
  const handleSend = async (text: string) => {
    if (!text || !roomId) return;
    
    try {
      const msg = {
        type: 'text',
        text: text,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(),
        userId: userId,
        sender: 'me'
      };
      
      // Firebase에 메시지 저장
      const messagesRef = collection(db, "chatRooms", roomId, "messages");
      const docRef = await addDoc(messagesRef, msg);
      
      // Socket.IO로 메시지 전송
      if (socket) {
        socket.emit("chat message", { ...msg, id: docRef.id, roomId });
      }
    } catch (error) {
      console.error('메시지 전송 중 에러 발생:', error);
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 이미지 전송
  const handleSendImage = async (url: string) => {
    if (!url || !roomId) {
      console.error('이미지 URL이 없습니다.');
      return;
    }
    
    try {
      const msg = {
        type: 'image',
        image: url,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(),
        userId: userId,
        sender: 'me'
      };
      
      // Firebase에 이미지 메시지 저장
      const messagesRef = collection(db, "chatRooms", roomId, "messages");
      const docRef = await addDoc(messagesRef, msg);
      
      // Socket.IO로 메시지 전송
      if (socket) {
        socket.emit("chat message", { ...msg, id: docRef.id, roomId });
      }
    } catch (error) {
      console.error('이미지 메시지 전송 중 에러 발생:', error);
      alert('이미지 전송에 실패했습니다.');
    }
  };

  // 거래완료 처리
  const handleDealComplete = async () => {
    if (!roomId) return;
    
    try {
      const dealCompleteMsg = {
        type: 'dealComplete',
        text: 'cloud1234님이 [거래완료]를 눌렀어요!',
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(),
        userId: userId,
        sender: 'other'
      };
      
      const messagesRef = collection(db, "chatRooms", roomId, "messages");
      await addDoc(messagesRef, dealCompleteMsg);
      
      setTimeout(() => {
        alert('거래가 완료되었습니다!');
      }, 100);
    } catch (error) {
      console.error('거래완료 메시지 저장 중 에러:', error);
      alert('거래가 완료되었습니다!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fafafa', width: '100%', maxWidth: '414px', margin: '0 auto' }}>
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
                 게시물 {postId} 채팅
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
