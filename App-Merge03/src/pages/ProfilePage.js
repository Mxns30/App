import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Avatar, IconButton, Container } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const handleImageChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        // 기존 코드 (png, jpg, webp 등)
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result;
          if (typeof result === 'string' && result.startsWith('data:image/')) {
            // 이미지 처리 로직
          } else {
            alert('이미지 파일을 읽을 수 없습니다.');
          }
        };
        reader.onerror = (err) => {
          alert('이미지 파일을 읽는 중 오류가 발생했습니다.');
          console.error('FileReader error:', err);
        };
        reader.readAsDataURL(file);
      } else {
        alert('이미지 파일만 업로드할 수 있습니다.');
      }
    }
  };

  return (
    <Container maxWidth="xs" sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 8, pb: 8 }}>
      <Box sx={{ bgcolor: '#fff', minHeight: '400px', position: 'relative', pt: 4, borderRadius: 2 }}>
        <IconButton sx={{ position: 'absolute', left: 16, top: 16 }} onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 6 }}>
          <Avatar sx={{ width: 96, height: 96, bgcolor: '#eee', mb: 2 }}>
            <span style={{ fontSize: 48 }}>🐾</span>
          </Avatar>
          <Typography fontWeight="bold" fontSize={24} color="#555">
            {userId || 'cloud1234'}
          </Typography>
        </Box>
        {/* 하단 연한 원 배경 */}
        <Box sx={{ position: 'absolute', left: -100, bottom: -60, width: 320, height: 320, bgcolor: '#fffde7', border: '2px solid #fff9c4', borderRadius: '50%', zIndex: 0, opacity: 1 }} />
        <Box sx={{ position: 'absolute', right: -80, bottom: -40, width: 320, height: 320, bgcolor: '#ffebee', border: '2px solid #ffd6e0', borderRadius: '50%', zIndex: 0, opacity: 1 }} />
      </Box>

      {/* 하단 네비게이션 */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          backgroundColor: '#fff',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 1000,
          maxWidth: '400px',
          margin: '0 auto'
        }}
      >
        <IconButton onClick={() => navigate('/')} sx={{ color: '#75757C' }}>
          <HomeOutlinedIcon />
        </IconButton>
        <IconButton onClick={() => navigate('/search')} sx={{ color: '#75757C' }}>
          <TravelExploreIcon />
        </IconButton>
        <IconButton onClick={() => navigate('/chat')} sx={{ color: '#75757C' }}>
          <ChatBubbleOutlineIcon />
        </IconButton>
        <IconButton onClick={() => navigate('/calendar')} sx={{ color: '#75757C' }}>
          <CalendarTodayIcon />
        </IconButton>
        <IconButton onClick={() => navigate('/my')} sx={{ color: '#1976d2' }}>
          <PersonOutlineIcon />
        </IconButton>
      </Box>
    </Container>
  );
};

export default ProfilePage;

