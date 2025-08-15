import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import io from 'socket.io-client';
import ChatInput from './components/ChatInput';
import ChatMessageList from './components/ChatMessageList';
import DealCompleteModal from './components/DealCompleteModal';
import AutoChatPage from './components/AutoChatPage';
import { v4 as uuidv4 } from 'uuid';

const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:3001'  // 임시로 로컬 서버 사용
  : 'http://localhost:3001';

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
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #007bff;
`;

// 버튼 스타일
const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: #0056b3;
  }
`;

// 홈페이지 컴포넌트
const HomePage = () => {
  const navigate = useNavigate();
  const [userId] = useState(() => localStorage.getItem('userId') || Date.now().toString());
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userId);
    }
  }, [userId]);

  // 사용자의 채팅방 목록 불러오기
  useEffect(() => {
    const loadChatRooms = async () => {
      try {
        const roomsRef = collection(db, "chatRooms");
        const q = query(roomsRef, orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const rooms = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(room => room.participants && room.participants.includes(userId))
            .slice(0, 10); // 최근 10개만 표시
          
          setChatRooms(rooms);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('채팅방 목록 불러오기 실패:', error);
        setLoading(false);
      }
    };

    if (userId) {
      loadChatRooms();
    }
  }, [userId]);

  const createNewChat = () => {
    const roomId = uuidv4();
    navigate(`/chat/${roomId}`);
  };

  const joinExistingChat = () => {
    // ID 입력 없이 바로 새 채팅방 생성
    const roomId = uuidv4();
    navigate(`/chat/${roomId}`);
  };

  // 채팅방 삭제 함수
  const deleteChatRoom = async (roomId, event) => {
    event.stopPropagation(); // 클릭 이벤트 전파 방지
    
    if (window.confirm('정말로 이 채팅방을 삭제하시겠습니까?')) {
      try {
        const roomRef = doc(db, "chatRooms", roomId);
        await setDoc(roomRef, { deleted: true }, { merge: true });
        console.log('채팅방 삭제됨:', roomId);
      } catch (error) {
        console.error('채팅방 삭제 중 에러:', error);
        alert('채팅방 삭제에 실패했습니다.');
      }
    }
  };

  // 게시물에서 채팅 시작 (자동으로 기존 채팅방 확인 후 입장/생성)
  const startChatFromPost = async (postId, sellerId) => {
    try {
      // 게시물 ID와 판매자 ID로 고유한 채팅방 ID 생성
      const roomId = generateRoomIdFromPost(postId, sellerId, userId);
      
      // 기존 채팅방이 있는지 확인
      const roomRef = doc(db, "chatRooms", roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (roomDoc.exists()) {
        console.log('기존 채팅방 발견, 입장:', roomId);
        // 기존 채팅방이 있으면 바로 입장
        navigate(`/chat/${roomId}?postId=${postId}&sellerId=${sellerId}`);
      } else {
        console.log('새 채팅방 생성:', roomId);
        // 채팅방이 없으면 새로 생성하고 입장
        navigate(`/chat/${roomId}?postId=${postId}&sellerId=${sellerId}`);
      }
    } catch (error) {
      console.error('채팅방 확인 중 에러:', error);
      // 에러 발생 시 기본적으로 새 채팅방 생성
      const roomId = generateRoomIdFromPost(postId, sellerId, userId);
      navigate(`/chat/${roomId}?postId=${postId}&sellerId=${sellerId}`);
    }
  };

  // 게시물 기반 채팅방 ID 생성 함수
  const generateRoomIdFromPost = (postId, sellerId, buyerId) => {
    // 정렬하여 항상 같은 순서로 ID 생성
    const sortedIds = [sellerId, buyerId].sort();
    return `${postId}_${sortedIds[0]}_${sortedIds[1]}`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AppContainer>
      <Header>채팅 앱</Header>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>채팅방 선택</h2>
        
        {/* 기존 채팅방 목록 */}
        {!loading && chatRooms.length > 0 && (
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>최근 채팅방</h3>
            {chatRooms
              .filter(room => !room.deleted) // 삭제된 채팅방 제외
              .map(room => (
              <div 
                key={room.id}
                onClick={() => navigate(`/chat/${room.id}${room.postId ? `?postId=${room.postId}&sellerId=${room.sellerId}` : ''}`)}
                style={{
                  padding: '12px',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#f9f9f9',
                  position: 'relative'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {room.postId ? `게시물 ${room.postId} 채팅` : `채팅방 ${room.id.slice(0, 8)}...`}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  참여자: {room.participants?.length || 0}명
                  {room.createdAt && ` • ${formatTime(room.createdAt)}`}
                </div>
                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => deleteChatRoom(room.id, e)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <Button onClick={createNewChat} style={{ marginBottom: '10px', width: '200px' }}>
            새 채팅방 만들기
          </Button>
          <br />
          <Button onClick={joinExistingChat} style={{ marginBottom: '10px', width: '200px' }}>
            기존 채팅방 참여
          </Button>
          <br />
          <Button 
            onClick={() => startChatFromPost('post123', 'seller456')} 
            style={{ width: '200px' }}
          >
            게시물에서 채팅 시작 (테스트)
          </Button>
        </div>
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          현재 사용자 ID: {userId}
        </div>
      </div>
    </AppContainer>
  );
};

// 채팅방 컴포넌트 (친구 프로젝트 구조 기반)
const ChatPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const postId = searchParams.get('postId');
  const sellerId = searchParams.get('sellerId');
  const [messages, setMessages] = useState([]);
  const [userId] = useState(() => localStorage.getItem('userId') || Date.now().toString());
  const [socket, setSocket] = useState(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const messagesEndRef = useRef(null);

  // userId가 없으면 저장
  useEffect(() => {
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userId);
    }
  }, [userId]);

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
      try {
        const roomRef = doc(db, "chatRooms", roomId);
        const roomDoc = await getDoc(roomRef);
        
        if (!roomDoc.exists()) {
          // 새 채팅방 생성
          const roomData = {
            createdAt: serverTimestamp(),
            participants: [userId],
            lastMessage: null
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
        } else {
          // 기존 채팅방에 참여자 추가 (중복 방지)
          const roomData = roomDoc.data();
          if (!roomData.participants.includes(userId)) {
            await setDoc(roomRef, {
              ...roomData,
              participants: [...roomData.participants, userId]
            }, { merge: true });
          }
          console.log('기존 채팅방 참여:', roomId);
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
        };
      });
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [roomId, userId]);

  // 새 메시지가 올 때 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송 (친구 프로젝트 방식 + Firebase 저장)
  const handleSend = async (text) => {
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

  // 이미지 전송 (친구 프로젝트 방식 + Firebase 저장)
  const handleSendImage = async (url) => {
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
        <BackButton onClick={() => navigate('/')}>← 뒤로</BackButton>
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
            `채팅방: ${roomId}`
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

// 메인 App 컴포넌트
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat/auto" element={<AutoChatPage />} />
        <Route path="/chat/:roomId" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}