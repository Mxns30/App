import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../config/firebase';
import PostCard from '../components/PostCard';
import { GridProps } from '@mui/material/Grid';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

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
  const [value, setValue] = useState(0);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

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
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const imageUrl = await getImageUrl(currentUser.uid, doc.id);
          return {
            id: doc.id,
            userId: currentUser.uid,
            ...data,
            imageUrl,
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
      <Typography variant="h4" gutterBottom>
        MY
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange}>
          <Tab label="내가 올린 게시물" />
          <Tab label="찜한 게시물" />
          <Tab label="최근 본 게시물" />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <Grid container spacing={3}>
          {myPosts.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={post.id} sx={{ display: 'flex' }}>
              <PostCard {...post} />
            </Grid>
          ))}
          {myPosts.length === 0 && (
            <Grid item xs={12} sx={{ display: 'flex' }}>
              <Typography align="center" color="text.secondary">
                등록한 게시물이 없습니다.
              </Typography>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      <TabPanel value={value} index={1}>
        <Grid container spacing={3}>
          {favorites.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={post.id} sx={{ display: 'flex' }}>
              <PostCard {...post} />
            </Grid>
          ))}
          {favorites.length === 0 && (
            <Grid item xs={12} sx={{ display: 'flex' }}>
              <Typography align="center" color="text.secondary">
                찜한 게시물이 없습니다.
              </Typography>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      <TabPanel value={value} index={2}>
        <Grid container spacing={3}>
          {recentlyViewed.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={post.id} sx={{ display: 'flex' }}>
              <PostCard {...post} />
            </Grid>
          ))}
          {recentlyViewed.length === 0 && (
            <Grid item xs={12} sx={{ display: 'flex' }}>
              <Typography align="center" color="text.secondary">
                최근 본 게시물이 없습니다.
              </Typography>
            </Grid>
          )}
        </Grid>
      </TabPanel>
      
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