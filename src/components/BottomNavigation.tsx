import React from 'react';
import { Box, IconButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getIconColor = (path: string) => {
    return location.pathname === path ? '#1abc9c' : '#666';
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: { xs: '100%', sm: '414px' },
        maxWidth: '414px',
        height: { xs: '70px', sm: '80px' },
        bgcolor: '#fff',
        borderTop: '1px solid #e0e0e0',
        borderLeft: { xs: 'none', sm: '1px solid #e0e0e0' },
        borderRight: { xs: 'none', sm: '1px solid #e0e0e0' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000,
        boxSizing: 'border-box',
      }}
    >
      <IconButton
        sx={{ 
          color: getIconColor('/'),
          minWidth: { xs: '48px', sm: '56px' },
          minHeight: { xs: '48px', sm: '56px' },
          '&:hover': { bgcolor: 'rgba(26, 188, 156, 0.1)' }
        }}
        onClick={() => navigate('/')}
      >
        <HomeOutlinedIcon sx={{ fontSize: { xs: '24px', sm: '28px' } }} />
      </IconButton>
      <IconButton
        sx={{ 
          color: getIconColor('/search'),
          minWidth: { xs: '48px', sm: '56px' },
          minHeight: { xs: '48px', sm: '56px' },
          '&:hover': { bgcolor: 'rgba(26, 188, 156, 0.1)' }
        }}
        onClick={() => navigate('/search')}
      >
        <TravelExploreIcon sx={{ fontSize: { xs: '24px', sm: '28px' } }} />
      </IconButton>
      <IconButton
        sx={{ 
          color: getIconColor('/chat'),
          minWidth: { xs: '48px', sm: '56px' },
          minHeight: { xs: '48px', sm: '56px' },
          '&:hover': { bgcolor: 'rgba(26, 188, 156, 0.1)' }
        }}
        onClick={() => navigate('/chat')}
      >
        <ChatBubbleOutlineIcon sx={{ fontSize: { xs: '24px', sm: '28px' } }} />
      </IconButton>
      <IconButton
        sx={{ 
          color: getIconColor('/calendar'),
          minWidth: { xs: '48px', sm: '56px' },
          minHeight: { xs: '48px', sm: '56px' },
          '&:hover': { bgcolor: 'rgba(26, 188, 156, 0.1)' }
        }}
        onClick={() => navigate('/calendar')}
      >
        <CalendarTodayIcon sx={{ fontSize: { xs: '24px', sm: '28px' } }} />
      </IconButton>
      <IconButton
        sx={{ 
          color: getIconColor('/my'),
          minWidth: { xs: '48px', sm: '56px' },
          minHeight: { xs: '48px', sm: '56px' },
          '&:hover': { bgcolor: 'rgba(26, 188, 156, 0.1)' }
        }}
        onClick={() => navigate('/my')}
      >
        <PersonOutlineIcon sx={{ fontSize: { xs: '24px', sm: '28px' } }} />
      </IconButton>
    </Box>
  );
};

export default BottomNavigation;
