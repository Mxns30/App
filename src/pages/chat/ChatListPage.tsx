import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Firebase import 제거 (로컬 저장소 사용)
import styled from 'styled-components';
import { Box, IconButton } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

// 전체 컨테이너
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh; /* 모바일에서 동적 viewport 높이 사용 */
  background: #fff;
  overflow: hidden;
  padding-bottom: 80px; /* 하단 네비게이션 공간 확보 */
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


const RefreshButton = styled.button`
  background: linear-gradient(135deg, #30D6A3, #5ED381);
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  color: #fff;
  box-shadow: 0 2px 8px rgba(48, 214, 163, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(48, 214, 163, 0.4);
    background: linear-gradient(135deg, #5ED381, #30D6A3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// 채팅방 리스트
const ChatList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const ChatItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  background-color: #f9f9f9;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const ChatInfo = styled.div`
  flex: 1;
  margin-left: 12px;
`;

const ChatTitle = styled.div`
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
`;

const ChatSubtitle = styled.div`
  font-size: 12px;
  color: #666;
`;

const ChatTime = styled.div`
  font-size: 12px;
  color: #999;
  margin-left: 8px;
`;

const DeleteButton = styled.button`
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 8px;
  
  &:hover {
    background: #cc3333;
  }
`;

// 빈 상태
const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`;

interface ChatRoom {
  id: string;
  createdAt: any;
  updatedAt?: any;
  participants: string[];
  postId?: string;
  sellerId?: string;
  buyerId?: string;
  postTitle?: string;
  deleted?: boolean;
  type?: string;
  status?: string;
  createdBy?: string;
  messages?: any[];
  lastMessage?: {
    text?: string;
    timestamp?: any;
  };
}

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const [userId] = useState(() => {
    const stored = localStorage.getItem('userId');
    if (stored) {
      console.log('ChatListPage - 저장된 사용자 ID 사용:', stored);
      return stored;
    } else {
      // 로그인하지 않은 경우 기본 ID 생성
      const newId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('ChatListPage - 새 게스트 ID 생성:', newId);
      localStorage.setItem('userId', newId);
      return newId;
    }
  });
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // 사용자의 채팅방 목록 불러오기
  useEffect(() => {
    const loadChatRooms = () => {
      try {
        console.log('채팅방 목록 로딩 시작 (로컬 저장소)...');
        console.log('현재 사용자 ID (목록 조회):', userId);
        console.log('사용자 ID 타입:', typeof userId);
        
        // 로컬 저장소에서 채팅방 목록 가져오기
        const allRooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
        
        console.log('=== 채팅방 목록 로딩 (로컬 저장소) ===');
        console.log('모든 채팅방 개수:', allRooms.length);
        console.log('모든 채팅방:', allRooms);
        console.log('현재 사용자 ID:', userId);
        console.log('사용자 ID 타입:', typeof userId);
        
        const filteredRooms = allRooms.filter((room: any) => {
          const hasParticipants = room.participants && Array.isArray(room.participants);
          const includesUser = hasParticipants && room.participants.includes(userId);
          const notDeleted = !room.deleted;
          
          console.log(`채팅방 ${room.id} 검사:`, {
            participants: room.participants,
            hasParticipants,
            includesUser,
            notDeleted,
            userId,
            participantTypes: room.participants?.map((p: any) => typeof p),
            postId: room.postId,
            sellerId: room.sellerId,
            type: room.type
          });
          
          // 참여자 목록이 있고, 현재 사용자가 포함되어 있으며, 삭제되지 않은 채팅방
          return hasParticipants && includesUser && notDeleted;
        });
        
        // updatedAt 기준으로 정렬 (있으면 updatedAt, 없으면 createdAt)
        const sortedRooms = filteredRooms.sort((a: any, b: any) => {
          const aTime = a.updatedAt || a.createdAt;
          const bTime = b.updatedAt || b.createdAt;
          
          if (!aTime || !bTime) return 0;
          
          const aDate = new Date(aTime);
          const bDate = new Date(bTime);
          
          return bDate.getTime() - aDate.getTime();
        }).slice(0, 20); // 최근 20개만 표시
        
        console.log('필터링된 채팅방 목록:', sortedRooms);
        console.log('채팅방 개수:', sortedRooms.length);
        setChatRooms(sortedRooms);
        setLoading(false);
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



  // 채팅방 삭제 함수 (로컬 저장소 사용)
  const deleteChatRoom = (roomId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 클릭 이벤트 전파 방지
    
    if (window.confirm('정말로 이 채팅방을 삭제하시겠습니까?')) {
      try {
        const existingRooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
        const updatedRooms = existingRooms.filter((room: any) => room.id !== roomId);
        localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));
        
        // 목록에서 제거
        setChatRooms(prev => prev.filter(room => room.id !== roomId));
        console.log('채팅방 삭제됨 (로컬 저장소):', roomId);
      } catch (error) {
        console.error('채팅방 삭제 중 에러:', error);
        alert('채팅방 삭제에 실패했습니다.');
      }
    }
  };

  // 채팅방 제목 생성
  const getChatTitle = (room: ChatRoom) => {
    console.log('getChatTitle 호출:', {
      roomId: room.id,
      postId: room.postId,
      postTitle: room.postTitle,
      hasPostId: !!room.postId,
      hasPostTitle: !!room.postTitle
    });
    
    if (room.postId && room.postTitle) {
      console.log('실제 게시물 제목 사용:', room.postTitle);
      return room.postTitle;
    } else if (room.postId) {
      console.log('기본 게시물 제목 사용:', `게시물 ${room.postId} 채팅`);
      return `게시물 ${room.postId} 채팅`;
    } else {
      console.log('일반 채팅방 제목 사용:', `채팅방 ${room.id.slice(0, 8)}...`);
      return `채팅방 ${room.id.slice(0, 8)}...`;
    }
  };

  // 채팅방 부제목 생성
  const getChatSubtitle = (room: ChatRoom) => {
    if (room.postId && room.sellerId) {
      return `판매자: ${room.sellerId}`;
    } else {
      return `참여자: ${room.participants?.length || 0}명`;
    }
  };

  // 시간 포맷팅
  const formatTime = (timestamp: any) => {
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
  const formatLastMessageTime = (timestamp: any) => {
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
  const getChatRoomTime = (room: ChatRoom) => {
    if (room.lastMessage?.timestamp) {
      return formatLastMessageTime(room.lastMessage.timestamp);
    } else if (room.updatedAt) {
      return formatLastMessageTime(room.updatedAt);
    } else {
      return formatTime(room.createdAt);
    }
  };

    return (
    <AppContainer>
      <Header>
        <div></div>
        <div>채팅 목록</div>
        <div>
          <RefreshButton onClick={handleRefresh}>🔄</RefreshButton>
        </div>
      </Header>
      
      <ChatList>
        {(() => {
          console.log('렌더링 상태:', { loading, chatRoomsLength: chatRooms.length, chatRooms });
          return null;
        })()}
        {loading ? (
          <EmptyState>채팅방을 불러오는 중...</EmptyState>
        ) : chatRooms.length === 0 ? (
          <EmptyState>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>💬</div>
            <div>아직 채팅방이 없습니다.</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
              게시물에서 "채팅하기" 버튼을 눌러 채팅을 시작해보세요!
            </div>
            <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
              새로고침 버튼(🔄)을 눌러 목록을 업데이트할 수 있습니다.
            </div>
          </EmptyState>
        ) : (
          <div>
            {chatRooms.map(room => {
              console.log('채팅방 렌더링:', room);
              return (
                <div key={room.id} style={{
                  background: 'white',
                  border: '2px solid #30D6A3',
                  borderRadius: '12px',
                  padding: '16px',
                  margin: '8px 0',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(48, 214, 163, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => navigate(`/chat/${room.id}${room.postId ? `?postId=${room.postId}&sellerId=${room.sellerId}` : ''}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '50px', 
                      height: '50px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #30D6A3, #5ED381)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      {room.postId ? '🛒' : '💬'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '16px' }}>
                        {getChatTitle(room)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                        참여자: {room.participants?.join(', ') || '없음'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {room.lastMessage?.text || '아직 메시지가 없습니다.'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {room.updatedAt ? new Date(room.updatedAt.seconds * 1000).toLocaleString() : '방금 전'}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChatRoom(room.id, e);
                        }}
                        style={{
                          background: '#ff6b6b',
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ChatList>
      
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
    </AppContainer>
  );
};

export default ChatListPage;
