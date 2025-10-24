import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Button,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
// import PostCard from '../components/PostCard';
// import { GridProps } from '@mui/material/Grid'; // unused

// TabPanel 제거: 리스트 영역을 숨김 처리

interface Post {
  id: string;
  userId: string;
  title: string;
  price: string;
  category: string;
  imageUrl: string;
  createdAt: string;
}

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [listOpen, setListOpen] = useState<null | 'my' | 'fav' | 'recent'>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const profileInputRef = React.useRef<HTMLInputElement>(null);

  // 탭 바/리스트 제거로 인한 스크롤 동작 생략

  const handleRowClick = (tabIndex: number) => {
    setListOpen(tabIndex === 0 ? 'my' : tabIndex === 1 ? 'fav' : 'recent');
  };

  const getCombinedPostId = (p: Post) => `${p.userId}_${p.id}`;

  // 이미지 URL 가져오기
  const getImageUrl = async (userId: string, postId: string): Promise<string> => {
    try {
      const storageRef = ref(storage, `posts/${userId}/${postId}`);
      const result = await listAll(storageRef);
      
      if (result.items.length > 0) {
        return await getDownloadURL(result.items[0]);
      }
      return '/placeholder-image.jpg';
    } catch (error) {
      console.error('Error getting image URL:', error);
      return '/placeholder-image.jpg';
    }
  };

  // 내가 올린 게시물 가져오기
  const fetchMyPosts = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const postsRef = collection(db, 'posts', currentUser.uid, 'userPosts');
      const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(postsQuery);

      const posts = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() as any;
          const imageUrl = await getImageUrl(currentUser.uid, docSnap.id);
          return {
            id: docSnap.id,
            userId: currentUser.uid,
            title: data.postTitle || data.title || '',
            price: String(data.postPrice ?? data.price ?? ''),
            category: data.postCategory || data.category || '',
            imageUrl: imageUrl || '/placeholder-image.jpg',
            createdAt: data.createdAt,
          } as Post;
        })
      );

      setMyPosts(posts);
    } catch (err) {
      console.error('Error fetching my posts:', err);
      setError('게시물을 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 찜한 게시물 가져오기
  const fetchFavorites = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const favoritesRef = collection(db, 'users', currentUser.uid, 'likes');
      const favoritesQuery = query(favoritesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(favoritesQuery);

      const favorites = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          return {
            id: data.postId,
            userId: data.sellerId,
            title: data.postTitle,
            price: data.postPrice,
            category: data.postCategory,
            imageUrl: data.postImage || '/placeholder-image.jpg',
            createdAt: data.createdAt,
          } as Post;
        })
      );

      setFavorites(favorites);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('찜한 게시물을 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 최근 본 게시물 가져오기
  const fetchRecentlyViewed = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const viewedRef = collection(db, 'users', currentUser.uid, 'viewed');
      const viewedQuery = query(viewedRef, orderBy('viewedAt', 'desc'));
      const querySnapshot = await getDocs(viewedQuery);

      const viewed = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const imageUrl = await getImageUrl(data.sellerId, data.postId);
          return {
            id: data.postId,
            userId: data.sellerId,
            title: data.postTitle,
            price: data.postPrice,
            category: data.postCategory,
            imageUrl,
            createdAt: data.viewedAt,
          } as Post;
        })
      );

      setRecentlyViewed(viewed);
    } catch (err) {
      console.error('Error fetching recently viewed:', err);
      setError('최근 본 게시물을 불러오는 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchMyPosts(),
        fetchFavorites(),
        fetchRecentlyViewed(),
      ]);
      // 사용자 프로필 불러오기
      try {
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data() as any;
            if (data.photoUrl) setProfileUrl(data.photoUrl);
          }
        }
      } catch (e) {
        // ignore profile errors
      }
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: 12, position: 'relative' }}>
      {/* 프로필 헤더 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2, position: 'relative' }}>
        <Avatar src={profileUrl || undefined} sx={{ width: 96, height: 96, bgcolor: '#eaeaea', mb: 1 }}>
          {!profileUrl && '🐾'}
        </Avatar>
        {!profileUrl && (
          <>
            <button
              onClick={() => profileInputRef.current?.click()}
              style={{
                position: 'absolute',
                top: 8,
                right: 'calc(50% - 72px)',
                transform: 'translateX(50%)',
                background: '#1abc9c',
                color: '#fff',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: 16,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                fontSize: 20,
                lineHeight: '32px',
                fontWeight: 700
              }}
              title="프로필 사진 추가"
              disabled={uploadingProfile}
            >
              {uploadingProfile ? '…' : '+'}
            </button>
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const user = auth.currentUser;
                if (!user) return;
                try {
                  setUploadingProfile(true);
                  // Storage 보안 규칙에 맞춘 경로: profiles/{userId}/{fileName}
                  const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}_${file.name}`);
                  await uploadBytes(storageRef, file);
                  const url = await getDownloadURL(storageRef);
                  setProfileUrl(url);
                  // Firestore에 photoUrl 저장
                  const userRef = doc(db, 'users', user.uid);
                  await setDoc(userRef, { photoUrl: url }, { merge: true });
                  // Auth 프로필도 갱신
                  try { await updateProfile(user, { photoURL: url }); } catch {}
                } catch (err) {
                  alert('프로필 업로드에 실패했습니다.');
                  console.error('Profile upload error:', err);
                } finally {
                  setUploadingProfile(false);
                  if (profileInputRef.current) profileInputRef.current.value = '';
                }
              }}
            />
          </>
        )}
        {profileUrl && (
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Button size="small" variant="outlined" onClick={() => profileInputRef.current?.click()} disabled={uploadingProfile}>
              변경
            </Button>
            <Button size="small" color="error" variant="outlined" disabled={uploadingProfile}
              onClick={async () => {
                const user = auth.currentUser;
                if (!user || !profileUrl) return;
                try {
                  setUploadingProfile(true);
                  // 현재 파일 삭제 (URL로 참조 가능)
                  try { const toDeleteRef = ref(storage, profileUrl); await deleteObject(toDeleteRef); } catch {}
                  // Firestore와 Auth에서 제거
                  await setDoc(doc(db, 'users', user.uid), { photoUrl: null }, { merge: true });
                  try { await updateProfile(user, { photoURL: null as any }); } catch {}
                  setProfileUrl(null);
                } catch (err) {
                  alert('프로필 삭제에 실패했습니다.');
                  console.error('Profile delete error:', err);
                } finally {
                  setUploadingProfile(false);
                }
              }}
            >
              삭제
            </Button>
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const user = auth.currentUser;
                if (!user) return;
                try {
                  setUploadingProfile(true);
                  const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}_${file.name}`);
                  await uploadBytes(storageRef, file);
                  const url = await getDownloadURL(storageRef);
                  setProfileUrl(url);
                  await setDoc(doc(db, 'users', user.uid), { photoUrl: url }, { merge: true });
                  try { await updateProfile(user, { photoURL: url }); } catch {}
                } catch (err) {
                  alert('프로필 업로드에 실패했습니다.');
                  console.error('Profile upload error:', err);
                } finally {
                  setUploadingProfile(false);
                  if (profileInputRef.current) profileInputRef.current.value = '';
                }
              }}
            />
          </Box>
        )}
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#444' }}>
          {auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || auth.currentUser?.uid?.slice(-6) || 'MY'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{
              color: '#1abc9c',
              borderColor: '#1abc9c',
              '&:hover': { color: '#16a085', borderColor: '#16a085', backgroundColor: 'rgba(26, 188, 156, 0.06)' }
            }}
            onClick={async () => {
              try {
                await logout();
                localStorage.setItem('currentScreen', 'splash');
                window.location.href = '/';
              } catch (e) {
                console.error('로그아웃 실패:', e);
              }
            }}
          >
            로그아웃
          </Button>
        </Box>
      </Box>

      {/* 상단 3개의 행 네비게이션 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
        <Box onClick={() => handleRowClick(0)} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, cursor: 'pointer', borderBottom: '1px solid #eee' }}>
          <DescriptionOutlinedIcon sx={{ color: '#777', mr: 1 }} />
          <Typography flex={1} sx={{ color: '#333', fontWeight: 600 }}>내가 올린 게시물</Typography>
          <ChevronRightIcon sx={{ color: '#bbb' }} />
        </Box>
        <Box onClick={() => handleRowClick(1)} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, cursor: 'pointer', borderBottom: '1px solid #eee' }}>
          <StarBorderIcon sx={{ color: '#777', mr: 1 }} />
          <Typography flex={1} sx={{ color: '#333', fontWeight: 600 }}>즐겨찾기</Typography>
          <ChevronRightIcon sx={{ color: '#bbb' }} />
        </Box>
        <Box onClick={() => handleRowClick(2)} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, cursor: 'pointer', borderBottom: '1px solid #eee' }}>
          <AccessTimeIcon sx={{ color: '#777', mr: 1 }} />
          <Typography flex={1} sx={{ color: '#333', fontWeight: 600 }}>최근 본 게시물</Typography>
          <ChevronRightIcon sx={{ color: '#bbb' }} />
        </Box>
      </Box>

      {/* 중간의 최근 본 게시물 가로 섹션 제거 */}

      {/* 리스트 영역: 페이지 내 카드형(칸) 레이아웃으로 표시 */}
      {listOpen && (
        <Box sx={{ mt: 1 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>
            {listOpen === 'my' ? '내가 올린 게시물' : listOpen === 'fav' ? '즐겨찾기' : '최근 본 게시물'}
          </Typography>
          <Grid container spacing={2}>
            {(listOpen === 'my' ? myPosts : listOpen === 'fav' ? favorites : recentlyViewed).map((p) => (
              <Grid item xs={12} key={`${p.userId}_${p.id}`}>
                <Box onClick={() => navigate(`/post/${p.userId}_${p.id}`)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid #eee', borderRadius: 2, bgcolor: '#fff', cursor: 'pointer' }}>
                  <Box sx={{ width: 72, height: 72, bgcolor: '#eee', borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                    {p.imageUrl && <img src={p.imageUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={700} noWrap>{p.title}</Typography>
                    <Typography fontSize={12} color="#999" noWrap>
                      {p.category}
                    </Typography>
                    <Typography fontWeight={800}>{Number(p.price).toLocaleString()}원</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
            {(listOpen === 'my' ? myPosts : listOpen === 'fav' ? favorites : recentlyViewed).length === 0 && (
              <Grid item xs={12}>
                <Typography color="text.secondary">
                  {listOpen === 'my' ? '등록한 게시물이 없습니다.' : listOpen === 'fav' ? '찜한 게시물이 없습니다.' : '최근 본 게시물이 없습니다.'}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
      
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
          sx={{ color: '#666', minWidth: 'auto' }}
          onClick={() => navigate('/')}
        >
          <HomeOutlinedIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#666', minWidth: 'auto' }}
          onClick={() => navigate('/search')}
        >
          <TravelExploreIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#666', minWidth: 'auto' }}
          onClick={() => navigate('/chat')}
        >
          <ChatBubbleOutlineIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#666', minWidth: 'auto' }}
          onClick={() => navigate('/calendar')}
        >
          <CalendarTodayIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#1abc9c', minWidth: 'auto' }}
          onClick={() => navigate('/my')}
        >
          <PersonOutlineIcon />
        </IconButton>
      </Box>
    </Container>
  );
};

export default MyPage; 