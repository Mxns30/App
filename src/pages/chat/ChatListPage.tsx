import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, doc, setDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import styled from 'styled-components';
import { Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import BottomNav from '../../components/BottomNav';

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

// BackButton 정의는 사용되지 않아 제거

const RefreshButton = styled.button`
  background: linear-gradient(135deg, #B9F6CA, #C8E6C9);
  border: none;
  border-radius: 20px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  color: #2E7D32;
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.25);
    background: linear-gradient(135deg, #C8E6C9, #B9F6CA);
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
  deleted?: boolean;
  lastMessage?: {
    text?: string;
    timestamp?: any;
  };
}

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentSchool } = useSchool();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [postTitles, setPostTitles] = useState<{[key: string]: string}>({});
  const [sellerNames, setSellerNames] = useState<{ [uid: string]: string }>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRoomId, setConfirmRoomId] = useState<string | null>(null);

  // Firebase Auth 사용자 ID 사용
  const userId = currentUser?.uid || 'anonymous';

  // 게시물 제목 가져오기 함수
  const fetchPostTitle = async (postId: string) => {
    try {
      console.log('🔍 게시물 제목 검색 중:', postId);
      
      // postId가 "userId_docId" 형식인지 확인
      if (postId.includes('_')) {
        const [userId, docId] = postId.split('_');
        console.log('📝 사용자 ID:', userId, '문서 ID:', docId);
        
        // 특정 사용자의 특정 게시물에서 직접 가져오기
        const postRef = doc(db, 'posts', userId, 'userPosts', docId);
        const postDoc = await getDoc(postRef);
        
        if (postDoc.exists()) {
          const postData = postDoc.data();
          console.log('✅ 게시물 찾음:', postData.title);
          return postData.title || '제목 없음';
        }
      }
      
      // 기존 방식으로 전체 검색 (fallback)
      console.log('🔄 전체 검색으로 전환...');
      const postsRef = collection(db, 'posts');
      const q = query(postsRef);
      const querySnapshot = await getDocs(q);
      
      for (const userDoc of querySnapshot.docs) {
        const userPostsRef = collection(db, 'posts', userDoc.id, 'userPosts');
        const userPostsSnapshot = await getDocs(userPostsRef);
        
        for (const postDoc of userPostsSnapshot.docs) {
          const postData = postDoc.data();
          // Firebase 문서 ID와 postId 비교
          if (postDoc.id === postId) {
            console.log('✅ 게시물 찾음 (전체 검색):', postData.title);
            return postData.title || '제목 없음';
          }
        }
      }
      
      console.log('❌ 게시물을 찾지 못함:', postId);
      // Firebase에서 찾지 못한 경우 삭제된 게시물 문구로 반환
      return '삭제된 게시물 입니다.';
    } catch (error) {
      console.error('게시물 제목 가져오기 실패:', error);
      return '삭제된 게시물 입니다.';
    }
  };

  // 사용자의 채팅방 목록 불러오기
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const loadChatRooms = async () => {
      try {
        // 이전 리스너가 있으면 정리
        if (unsubscribe) {
          console.log('이전 Firebase 리스너 정리 중...');
          unsubscribe();
        }
        
        const roomsRef = collection(db, "chatRooms");
        // 인덱스 문제를 피하기 위해 정렬 없이 모든 채팅방을 가져온 후 클라이언트에서 정렬
        const q = query(roomsRef);
        
        console.log('채팅방 목록 로딩 시작...');
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const allRooms = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as ChatRoom));
          
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
            const bySchool = currentSchool ? ((room as any).school === currentSchool) : true;
            
            console.log(`채팅방 ${room.id} 검사:`, {
              participants: room.participants,
              hasParticipants,
              includesUser,
              notDeleted,
              userId,
              participantTypes: room.participants?.map(p => typeof p)
            });
            
            // 참여자 목록이 있고, 현재 사용자가 포함되어 있으며, 삭제되지 않은 채팅방
            return hasParticipants && includesUser && notDeleted && bySchool;
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
          
          // 게시물 제목 가져오기
          const titlePromises = sortedRooms
            .filter(room => room.postId)
            .map(async (room) => {
              const title = await fetchPostTitle(room.postId!);
              return { postId: room.postId!, title };
            });
          
          Promise.all(titlePromises).then(results => {
            const titleMap: {[key: string]: string} = {};
            results.forEach(({ postId, title }) => {
              titleMap[postId] = title;
            });
            setPostTitles(titleMap);
          });

          // 판매자 표시명(userId) 가져오기 (users/{sellerId}.userId)
          const uniqueSellerIds = Array.from(new Set(sortedRooms.map(r => r.sellerId).filter(Boolean))) as string[];
          const needFetch = uniqueSellerIds.filter(uid => !(uid in sellerNames));
          if (needFetch.length > 0) {
            Promise.all(
              needFetch.map(async (uid) => {
                try {
                  const userRef = doc(db, 'users', uid);
                  const snap = await getDoc(userRef);
                  if (snap.exists()) {
                    const data = snap.data() as any;
                    return { uid, name: data.userId || data.displayName || uid };
                  }
                } catch (e) {
                  // ignore
                }
                return { uid, name: uid };
              })
            ).then(entries => {
              setSellerNames(prev => {
                const next = { ...prev };
                entries.forEach(({ uid, name }) => { next[uid] = name; });
                return next;
              });
            });
          }
          
          setLoading(false);
        });
      } catch (error) {
        console.error('채팅방 목록 불러오기 실패:', error);
        setLoading(false);
      }
    };

    if (userId) {
      loadChatRooms();
    }
    
    // cleanup 함수에서 unsubscribe 호출
    return () => {
      if (unsubscribe) {
        console.log('Firebase 리스너 정리 중...');
        try {
          unsubscribe();
        } catch (error) {
          console.log('Firebase 리스너 정리 중 오류:', error);
        }
      }
    };
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
  const deleteChatRoom = async (roomId: string) => {
    try {
      const roomRef = doc(db, "chatRooms", roomId);
      await setDoc(roomRef, { deleted: true }, { merge: true });
      console.log('채팅방 삭제됨:', roomId);
    } catch (error) {
      console.error('채팅방 삭제 중 에러:', error);
      alert('채팅방 삭제에 실패했습니다.');
    }
  };

  const openDeleteConfirm = (roomId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmRoomId(roomId);
    setConfirmOpen(true);
  };

  // 채팅방 제목 생성
  const getChatTitle = (room: ChatRoom) => {
    if (room.postId && postTitles[room.postId]) {
      return postTitles[room.postId];
    } else if (room.postId) {
      return `게시물 ${room.postId}`;
    } else {
      return `채팅방 ${room.id.slice(0, 8)}...`;
    }
  };

  // 채팅방 부제목 생성
  const getChatSubtitle = (room: ChatRoom) => {
    if (room.postId && postTitles[room.postId] === '삭제된 게시물 입니다.') {
      return '삭제된 게시물 입니다.';
    }
    if (room.postId && room.sellerId) {
      const name = sellerNames[room.sellerId] || '불러오는 중...';
      return `판매자: ${name}`;
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
        <RefreshButton onClick={handleRefresh} aria-label="새로고침">
          <AutorenewIcon sx={{ fontSize: 20, color: '#2E7D32' }} />
        </RefreshButton>
      </Header>
      
      <ChatList>
        {loading ? (
          <EmptyState>채팅방을 불러오는 중...</EmptyState>
        ) : chatRooms.length === 0 ? (
          <EmptyState>
            <div style={{ marginBottom: '8px' }}>
              <PetsIcon sx={{ fontSize: 28, color: '#2E7D32' }} />
            </div>
            <div>아직 채팅방이 없습니다.</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
              게시물에서 "채팅하기" 버튼을 눌러 채팅을 시작해보세요!
            </div>
            <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
              새로고침 버튼을 눌러 목록을 업데이트할 수 있습니다.
            </div>
          </EmptyState>
        ) : (
          chatRooms.map(room => (
            <ChatItem 
              key={room.id}
              onClick={() => navigate(`/chat/${room.id}${room.postId ? `?postId=${room.postId}&sellerId=${room.sellerId}` : ''}`)}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: '#C8E6C9', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                <PetsIcon sx={{ fontSize: 22, color: '#2E7D32' }} />
              </div>
              
              <ChatInfo>
                <ChatTitle
                  style={getChatTitle(room) === '삭제된 게시물 입니다.' ? { color: '#d32f2f', textDecoration: 'line-through' } : undefined}
                >
                  {getChatTitle(room)}
                </ChatTitle>
                {getChatSubtitle(room) !== '삭제된 게시물 입니다.' && (
                  <ChatSubtitle>
                    {getChatSubtitle(room)}
                  </ChatSubtitle>
                )}
              </ChatInfo>
              
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ChatTime>
                    {getChatRoomTime(room)}
                  </ChatTime>
                  <DeleteButton onClick={(e) => openDeleteConfirm(room.id, e)}>
                    삭제
                  </DeleteButton>
                </div>
            </ChatItem>
          ))
        )}
      </ChatList>
      
      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>삭제된 대화는 복원되지 않습니다. 삭제하겠습니까?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: '#666' }}>취소</Button>
          <Button
            onClick={async () => {
              if (confirmRoomId) {
                await deleteChatRoom(confirmRoomId);
              }
              setConfirmOpen(false);
              setConfirmRoomId(null);
            }}
            sx={{ color: '#d32f2f', fontWeight: 'bold' }}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      <BottomNav />
    </AppContainer>
  );
};

export default ChatListPage;
