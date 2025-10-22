import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import io, { Socket } from 'socket.io-client';
import ChatInput from '../../components/chat/ChatInput';
import ChatMessageList from '../../components/chat/ChatMessageList';
import DealCompleteModal from '../../components/chat/DealCompleteModal';

// 현재 호스트(IP 또는 도메인) 기준으로 소켓 서버에 연결 (LAN 테스트 지원)
const SOCKET_URL = `http://localhost:3015`;

interface Message {
  id?: string;
  type: string;
  text?: string;
  image?: string;
  time: string;
  timestamp: Date;
  userId: string;
  sender: string;
  roomId?: string;
}

const ChatPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const postId = searchParams.get('postId');
  const sellerId = searchParams.get('sellerId');
  const [messages, setMessages] = useState<Message[]>([]);

  const userId = currentUser?.uid || 'anonymous';
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Unsubscribe refs for Firestore listeners
  const messagesUnsubRef = useRef<null | (() => void)>(null);
  const lastInitRoomIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser) navigate('/');
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!roomId) navigate('/chat');
  }, [roomId, navigate]);

  useEffect(() => {
    console.log('🔌 Socket.IO 연결 시도:', SOCKET_URL);
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket.IO 연결됨:', newSocket.id);
    });
    newSocket.on('disconnect', () => {
      console.log('❌ Socket.IO 연결 해제됨');
    });
    newSocket.on('connect_error', (error) => {
      console.log('❌ Socket.IO 연결 오류:', error);
    });

    setSocket(newSocket);
    return () => {
      console.log('🔌 Socket.IO 연결 종료');
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (socket && roomId) {
      console.log('🏠 채팅방 참여 요청:', roomId);
      socket.emit('join room', roomId);

      socket.on('chat message', (msg: Message) => {
        console.log('📨 Socket.IO로 메시지 수신:', msg);
        setMessages(prev => {
          const exists = prev.some(m => m.id === msg.id);
          if (!exists) {
            console.log('✅ 새 메시지 추가됨');
            return [...prev, { ...msg, sender: msg.userId === userId ? 'me' : 'other' }];
          }
          console.log('⚠️ 중복 메시지 무시됨');
          return prev;
        });
      });

      socket.on('message', (msg: Message) => {
        console.log('Socket.IO로 텍스트 메시지 수신:', msg);
        setMessages(prev => {
          const exists = prev.some(m => m.text === msg.text && m.time === msg.time);
          if (!exists) {
            return [...prev, {
              ...msg,
              userId: msg.userId || 'unknown',
              sender: msg.userId === userId ? 'me' : 'other'
            }];
          }
          return prev;
        });
      });

      socket.on('image', (msg: Message) => {
        console.log('Socket.IO로 이미지 메시지 수신:', msg);
        setMessages(prev => {
          const exists = prev.some(m => m.image === msg.image && m.time === msg.time);
          if (!exists) {
            return [...prev, {
              ...msg,
              userId: msg.userId || 'unknown',
              sender: msg.userId === userId ? 'me' : 'other'
            }];
          }
          return prev;
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('chat message');
        socket.off('message');
        socket.off('image');
        socket.emit('leave room', roomId);
      }
    };
  }, [socket, roomId, userId]);

  useEffect(() => {
    const createOrJoinRoom = async () => {
      if (!roomId || !userId) return;

      try {
        const roomRef = doc(db, "chatRooms", roomId);
        const roomDoc = await getDoc(roomRef);

        if (!roomDoc.exists()) {
          const participants = [userId];
          if (postId && sellerId && !participants.includes(sellerId)) participants.push(sellerId);

          const roomData: any = {
            createdAt: serverTimestamp(),
            participants,
            lastMessage: null,
            updatedAt: serverTimestamp(),
            createdBy: userId,
            status: 'active',
          };

          if (postId && sellerId) {
            roomData.postId = postId;
            roomData.sellerId = sellerId;
            roomData.buyerId = userId;
            roomData.type = 'post_chat';
          } else {
            roomData.type = 'general_chat';
          }

          await setDoc(roomRef, roomData);
          console.log('새 채팅방 생성됨:', roomId);
          navigate('/chat');
        } else {
          const roomData = roomDoc.data();
          const currentParticipants = roomData.participants || [];

          if (!currentParticipants.includes(userId)) {
            const updatedParticipants = [...currentParticipants, userId];
            await setDoc(roomRef, {
              ...roomData,
              participants: updatedParticipants,
              updatedAt: serverTimestamp(),
            }, { merge: true });
            console.log('기존 채팅방에 참여자 추가:', roomId);
          } else {
            console.log('이미 참여 중인 채팅방:', roomId);
          }
        }
      } catch (error) {
        console.error('채팅방 생성/참여 중 에러:', error);
      }
    };

    // Guard: initialize once per roomId
    if (lastInitRoomIdRef.current === roomId) return;
    lastInitRoomIdRef.current = roomId || null;

    if (roomId && userId) createOrJoinRoom();
  }, [roomId, userId, postId, sellerId, navigate]);

  useEffect(() => {
    if (!roomId) return;

    // Close previous listener before opening a new one
    console.log('🔌 Closing previous messages listener');
    messagesUnsubRef.current?.();

    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    console.log('🔌 Setting up new messages listener for room:', roomId);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          userId: data.userId || 'unknown',
          sender: data.userId === userId ? 'me' : 'other'
        } as Message;
      });
      setMessages(messageList);
    });

    messagesUnsubRef.current = unsubscribe;

    return () => {
      console.log('🔌 Cleaning up messages listener');
      messagesUnsubRef.current?.();
      messagesUnsubRef.current = null;
    };
  }, [roomId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text || !roomId) return;

    console.log('📤 메시지 전송 시작:', { text, roomId, userId });

    try {
      const msg: Message = {
        type: 'text',
        text,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(),
        userId,
        sender: 'me',
      };

      console.log('📝 Firebase에 메시지 저장 중...', msg);
      const messagesRef = collection(db, "chatRooms", roomId, "messages");
      const docRef = await addDoc(messagesRef, msg);
      console.log('✅ Firebase 저장 완료:', docRef.id);

      if (socket) {
        const socketMsg = { ...msg, id: docRef.id, roomId };
        console.log('📡 Socket.IO로 메시지 브로드캐스트:', socketMsg);
        socket.emit("chat message", socketMsg);
        console.log('✅ Socket.IO 전송 완료');
      } else {
        console.log('❌ Socket.IO 연결 없음');
      }
    } catch (error) {
      console.error('❌ 메시지 전송 중 에러:', error);
      alert('메시지 전송 실패. 다시 시도하세요.');
    }
  };

  const handleSendImage = async (url: string) => {
    if (!url || !roomId) return;

    try {
      const msg: Message = {
        type: 'image',
        image: url,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(),
        userId,
        sender: 'me',
      };

      const messagesRef = collection(db, "chatRooms", roomId, "messages");
      const docRef = await addDoc(messagesRef, msg);

      if (socket) socket.emit("chat message", { ...msg, id: docRef.id, roomId });
    } catch (error) {
      console.error('이미지 전송 중 에러:', error);
      alert('이미지 전송 실패.');
    }
  };

  const handleDealComplete = async () => {
    if (!roomId) return;

    try {
      const dealCompleteMsg: Message = {
        type: 'dealComplete',
        text: 'cloud1234님이 [거래완료]를 눌렀어요!',
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(),
        userId,
        sender: 'other',
      };

      const messagesRef = collection(db, "chatRooms", roomId, "messages");
      await addDoc(messagesRef, dealCompleteMsg);

      // 게시물 상태를 localStorage에 저장된 리스트에서 완료로 표시
      if (postId) {
        try {
          const savedPosts = localStorage.getItem('posts');
          const posts = savedPosts ? JSON.parse(savedPosts) : [];
          const updated = posts.map((p: any) => p.id === Number(postId) ? { ...p, status: 'completed' } : p);
          localStorage.setItem('posts', JSON.stringify(updated));
        } catch (e) {
          console.error('거래완료 처리 중 게시물 상태 업데이트 실패:', e);
        }
      }

      setTimeout(() => alert('거래가 완료되었습니다!'), 100);
    } catch (error) {
      console.error('거래완료 메시지 저장 중 에러:', error);
      alert('거래가 완료되었습니다!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>
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
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>게시물 {postId} 채팅</div>
              <div style={{ fontSize: '12px', color: '#666' }}>판매자: {sellerId}</div>
            </div>
          ) : (
            `채팅방: ${roomId?.slice(0, 8)}...`
          )}
        </div>
        <div style={{ width: '60px' }}></div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        <ChatMessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSend} onSendImage={handleSendImage} onDealComplete={() => setShowDealModal(true)} />

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
