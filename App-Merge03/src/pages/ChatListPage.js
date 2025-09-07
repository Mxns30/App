import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, setDoc, enableNetwork } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Box, IconButton, Container } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

const ChatListPage = () => {
  const navigate = useNavigate();
  const [userId] = useState(() => {
    const stored = localStorage.getItem('userId');
    if (stored) {
      console.log('저장된 사용자 ID:', stored);
      return stored;
    } else {
      const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('새 사용자 ID 생성:', newId);
      localStorage.setItem('userId', newId);
      return newId;
    }
  });
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // 사용자의 채팅방 목록 불러오기
  useEffect(() => {
    const loadChatRooms = async () => {
      try {
        // 네트워크 연결 강제 활성화
        await enableNetwork(db);
        
        const roomsRef = collection(db, "chatRooms");
        // 인덱스 문제를 피하기 위해 정렬 없이 모든 채팅방을 가져온 후 클라이언트에서 정렬
        const q = query(roomsRef);
        
        console.log('채팅방 목록 로딩 시작...');
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const allRooms = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log('=== 채팅방 목록 로딩 ===');
          console.log('모든 채팅방 개수:', allRooms.length);
          console.log('모든 채팅방:', allRooms);
          console.log('현재 사용자 ID:', userId);
          console.log('사용자 ID 타입:', typeof userId);
          
          // Firebase에서 가져온 데이터가 있는지 확인
          if (allRooms.length === 0) {
            console.log('⚠️ Firebase에서 채팅방을 찾을 수 없습니다. 네트워크 연결을 확인하세요.');
          }
          
          const filteredRooms = allRooms.filter(room => {
            const hasParticipants = room.participants && Array.isArray(room.participants);
            const includesUser = hasParticipants && room.participants.includes(userId);
            const notDeleted = !room.deleted;
            
            console.log(`채팅방 ${room.id} 검사:`, {
              participants: room.participants,
              hasParticipants,
              includesUser,
              notDeleted,
              userId,
              participantTypes: room.participants?.map(p => typeof p)
            });
            
            // 참여자 목록이 있고, 현재 사용자가 포함되어 있으며, 삭제되지 않은 채팅방
            return hasParticipants && includesUser && notDeleted;
          });
          
          // updatedAt 기준으로 정렬 (있으면 updatedAt, 없으면 createdAt)
          const sortedRooms = filteredRooms.sort((a, b) => {
            const aTime = a.updatedAt || a.createdAt;
            const bTime = b.updatedAt || b.createdAt;
            
            if (!aTime || !bTime) return 0;
            
            const aDate = aTime.toDate ? aTime.toDate() : new Date(aTime);
            const bDate = bTime.toDate ? bTime.toDate() : new Date(bTime);
            
            return bDate.getTime() - aDate.getTime();
          }).slice(0, 20); // 최근 20개만 표시
          
          console.log('필터링된 채팅방 목록:', sortedRooms);
          setChatRooms(sortedRooms);
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
  }, [userId, refreshKey]);

  // 수동 새로고침 함수
  const handleRefresh = () => {
    console.log('수동 새로고침 실행');
    setRefreshKey(prev => prev + 1);
  };

  // 페이지 포커스 시 새로고침
  useEffect(() => {
    const handleFocus = () => {
      console.log('페이지 포커스됨, 채팅방 목록 새로고침');
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 페이지 마운트 시 강제 새로고침
  useEffect(() => {
    console.log('ChatListPage 마운트됨, 강제 새로고침');
    setRefreshKey(prev => prev + 1);
  }, []);

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

  // 채팅방 제목 생성
  const getChatTitle = (room) => {
    if (room.postId) {
      return `게시물 ${room.postId} 채팅`;
    } else {
      return `채팅방 ${room.id.slice(0, 8)}...`;
    }
  };

  // 채팅방 부제목 생성
  const getChatSubtitle = (room) => {
    if (room.postId && room.sellerId) {
      return `판매자: ${room.sellerId}`;
    } else {
      return `참여자: ${room.participants?.length || 0}명`;
    }
  };

  // 시간 포맷팅
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

  // 마지막 메시지 시간 포맷팅
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '어제';
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  // 채팅방 시간 표시 (updatedAt 우선, 없으면 createdAt)
  const getChatRoomTime = (room) => {
    if (room.lastMessage?.timestamp) {
      return formatLastMessageTime(room.lastMessage.timestamp);
    } else if (room.updatedAt) {
      return formatLastMessageTime(room.updatedAt);
    } else {
      return formatTime(room.createdAt);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 8, pb: 8 }}>
      {/* 헤더 */}
      <Box sx={{
        padding: '16px',
        background: '#fff',
        borderBottom: '1px solid #eee',
        textAlign: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
        borderRadius: 2
      }}>
        <Box></Box>
        <Box>채팅 목록</Box>
        <Box
          onClick={handleRefresh}
          sx={{
            background: 'linear-gradient(135deg, #30D6A3, #5ED381)',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(48, 214, 163, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          🔄
        </Box>
      </Box>
      
      {/* 채팅방 리스트 */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        backgroundColor: '#fff',
        borderRadius: 2,
        mb: 2
      }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666'
          }}>
            채팅방을 불러오는 중...
          </div>
        ) : chatRooms.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>💬</div>
            <div>아직 채팅방이 없습니다.</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
              게시물에서 "채팅하기" 버튼을 눌러 채팅을 시작해보세요!
            </div>
            <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
              새로고침 버튼(🔄)을 눌러 목록을 업데이트할 수 있습니다.
            </div>
          </div>
        ) : (
          chatRooms.map(room => (
            <div
              key={room.id}
              onClick={() => navigate(`/chat/${room.id}${room.postId ? `?postId=${room.postId}&sellerId=${room.sellerId}` : ''}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: '1px solid #eee',
                borderRadius: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                backgroundColor: '#f9f9f9',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: '#007bff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                fontSize: '16px', 
                fontWeight: 'bold' 
              }}>
                💬
              </div>
              
              <div style={{
                flex: 1,
                marginLeft: '12px'
              }}>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginBottom: '4px'
                }}>
                  {getChatTitle(room)}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666'
                }}>
                  {getChatSubtitle(room)}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  marginLeft: '8px'
                }}>
                  {getChatRoomTime(room)}
                </div>
                <button
                  onClick={(e) => deleteChatRoom(room.id, e)}
                  style={{
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginLeft: '8px'
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </Box>
      
      {/* 하단 네비게이션 */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: '#fff',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 1,
          zIndex: 1000,
        }}
      >
        <IconButton
          sx={{ color: '#666' }}
          onClick={() => navigate('/')}
        >
          <HomeOutlinedIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#666' }}
          onClick={() => navigate('/search')}
        >
          <TravelExploreIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#1abc9c' }}
          onClick={() => navigate('/chat')}
        >
          <ChatBubbleOutlineIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#666' }}
          onClick={() => navigate('/calendar')}
        >
          <CalendarTodayIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#666' }}
          onClick={() => navigate('/my')}
        >
          <PersonOutlineIcon />
        </IconButton>
      </Box>
    </Container>
  );
};

export default ChatListPage;
