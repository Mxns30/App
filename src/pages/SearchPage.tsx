import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, TextField, IconButton, Card, CardContent, Typography, MenuItem } from '@mui/material';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase.ts';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import BottomNavigation from '../components/BottomNavigation.tsx';

const categories = ['공학', '교육', '사회', '예체능', '의약', '인문', '자연'];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [school, setSchool] = useState('한양여자대학교');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Firebase에서 게시글 실시간 가져오기
  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filtered = posts.filter((post: any) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (school ? post.school === school : true)
  );

  return (
    <Container maxWidth="xs" sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 0, pb: 0, position: 'relative', width: '100%', maxWidth: '414px', overflowY: 'auto' }}>
      {/* 상단 바 */}
      <Box display="flex" alignItems="center" pt={3} pb={2} gap={1}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <TextField
          select
          value={school}
          onChange={e => setSchool(e.target.value)}
          size="small"
          variant="standard"
          sx={{ minWidth: 100, bgcolor: 'transparent', border: 'none', fontWeight: 'bold', fontSize: 18, pl: 0, '& .MuiInputBase-root': { bgcolor: 'transparent', fontWeight: 'bold', fontSize: 18 }, '& fieldset': { border: 'none' } }}
          InputProps={{ disableUnderline: true }}
        >
          <MenuItem value="한양여자대학교">한양여자대학교</MenuItem>
        </TextField>
        <Box flex={1} />
      </Box>
      {/* 검색창 */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TextField
          size="small"
          placeholder="검색어를 입력하세요"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          sx={{ flex: 1, borderRadius: 999, bgcolor: '#fff', border: '1px solid #e0e0e0', '& .MuiOutlinedInput-root': { borderRadius: 999, bgcolor: '#fff', px: 2, py: 0.5 } }}
          InputProps={{ style: { borderRadius: 999, background: '#fff' } }}
        />
        <IconButton
          sx={{
            bgcolor: '#fff',
            color: '#1abc9c',
            borderRadius: '999px',
            width: 56,
            height: 32,
            boxShadow: 1,
            border: '1px solid #e0e0e0',
            '&:hover': { bgcolor: '#f0fdfa' }
          }}
        >
          <SearchIcon />
        </IconButton>
      </Box>
      {/* 결과 리스트 */}
      <Box>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography>게시글을 불러오는 중...</Typography>
          </Box>
        ) : filtered.length === 0 ? (
          <Typography color="text.secondary" align="center" mt={4}>검색 결과가 없습니다.</Typography>
        ) : (
          filtered.map((post: any) => (
          <Card key={post.id} sx={{ display: 'flex', mb: 2, boxShadow: 0, cursor: 'pointer' }} onClick={() => navigate(`/post/${post.id}`)}>
            {post.image ? (
              <Box sx={{ width: 120, height: 120, borderRadius: 2, m: 1, overflow: 'hidden', bgcolor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ) : (
              <Box sx={{ width: 120, height: 120, bgcolor: '#e0e0e0', borderRadius: 2, m: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageOutlinedIcon sx={{ color: '#ccc', fontSize: 48 }} />
              </Box>
            )}
            <CardContent sx={{ flex: 1, p: 1 }}>
              <Typography fontWeight="bold" fontSize={16}>{post.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {post.school} | {post.major}
              </Typography>
              <Typography fontWeight="bold" fontSize={16}>{post.price?.toLocaleString()}원</Typography>
            </CardContent>
          </Card>
        ))
        )}
      </Box>
      
      <BottomNavigation />
    </Container>
  );
}
