import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhotoManager from '../../components/calendar/PhotoManager';

const PhotoManagerPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #ffffff, #ACEDD9, #99EFB3)',
      padding: '0',
      margin: '0',
      paddingBottom: '80px' // 하단 네비게이션 공간 확보
    }}>
      <PhotoManager />
      
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
          sx={{ color: '#666' }}
          onClick={() => navigate('/chat')}
        >
          <ChatBubbleOutlineIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#1abc9c' }}
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
    </div>
  );
};

export default PhotoManagerPage;
