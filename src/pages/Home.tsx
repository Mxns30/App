import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  CircularProgress,
  Container,
} from '@mui/material';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

interface Post {
  id: string;
  title: string;
  price: string;
  category: string;
  createdAt: string;
  userId: string;
  imageUrl?: string;
}

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const getFirstImageUrl = async (userId: string, postId: string): Promise<string | null> => {
    try {
      const storageRef = ref(storage, `posts/${userId}/${postId}`);
      const result = await listAll(storageRef);
      
      if (result.items.length > 0) {
        const firstImageRef = result.items[0];
        return await getDownloadURL(firstImageRef);
      }
      return null;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const allPosts: Post[] = [];

        // 모든 사용자의 게시글을 가져오기
        const usersSnapshot = await getDocs(collection(db, 'posts'));
        
        for (const userDoc of usersSnapshot.docs) {
          const userPostsRef = collection(db, 'posts', userDoc.id, 'userPosts');
          const userPostsQuery = query(userPostsRef, orderBy('createdAt', 'desc'));
          const userPostsSnapshot = await getDocs(userPostsQuery);

          for (const doc of userPostsSnapshot.docs) {
            const postData = doc.data() as Omit<Post, 'id'>;
            const imageUrl = await getFirstImageUrl(userDoc.id, doc.id);
            
            allPosts.push({
              id: doc.id,
              ...postData,
              imageUrl: imageUrl || '/placeholder-image.jpg',
            });
          }
        }

        // 최신순으로 정렬
        allPosts.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setPosts(allPosts);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handlePostClick = (postId: string, userId: string) => {
    navigate(`/post/${userId}/${postId}`);
  };

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
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {posts.map((post) => (
          <Grid item xs={12} sm={6} md={4} key={`${post.userId}-${post.id}`}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'transform 0.2s ease-in-out',
                },
              }}
              onClick={() => handlePostClick(post.id, post.userId)}
            >
              <CardMedia
                component="img"
                height="200"
                image={post.imageUrl}
                alt={post.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2" noWrap>
                  {post.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {post.category}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                  {Number(post.price).toLocaleString()}원
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home; 