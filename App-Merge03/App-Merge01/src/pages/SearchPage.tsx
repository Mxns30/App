import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, TextField, IconButton, Card, CardContent, Typography, MenuItem } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

const categories = ['공학', '교육', '사회', '예체능', '의약', '인문', '자연'];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [school, setSchool] = useState('한양여자대학교');
  const posts = JSON.parse(localStorage.getItem('posts') || '[]');
  const filtered = posts.filter((post: any) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (school ? post.school === school : true)
  );

  return (
    <Container maxWidth="xs" sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 0, pb: 8, position: 'relative' }}>
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
        {filtered.length === 0 && (
          <Typography color="text.secondary" align="center" mt={4}>검색 결과가 없습니다.</Typography>
        )}
        {filtered.map((post: any) => (
          <Card key={post.id} sx={{ display: 'flex', mb: 2, boxShadow: 0, cursor: 'pointer' }} onClick={() => navigate(`/post/${post.id}`)}>
            {post.image ? (
              <Box sx={{ width: 64, height: 64, borderRadius: 2, m: 1, overflow: 'hidden', bgcolor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ) : (
              <Box sx={{ width: 64, height: 64, bgcolor: '#e0e0e0', borderRadius: 2, m: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageOutlinedIcon sx={{ color: '#ccc', fontSize: 32 }} />
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
        ))}
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
          sx={{ color: '#1abc9c' }}
          onClick={() => navigate('/search')}
        >
          <TravelExploreIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#666' }}
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
} 