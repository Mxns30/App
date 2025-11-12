import React from 'react';
import { Box, IconButton } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Badge from '@mui/material/Badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUnreadChatCount } from '../hooks/useUnreadChatCount';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = useUnreadChatCount();

  const activeColor = '#1abc9c';
  const inactiveColor = '#666';

  const isActive = (path: string) => path === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(path);

  return (
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
      <IconButton sx={{ color: isActive('/') ? activeColor : inactiveColor }} onClick={() => navigate('/')}> <HomeOutlinedIcon /> </IconButton>
      <IconButton sx={{ color: isActive('/category') ? activeColor : inactiveColor }} onClick={() => navigate('/category')}>
        <CategoryOutlinedIcon />
      </IconButton>
      <IconButton sx={{ color: isActive('/chat') ? activeColor : inactiveColor }} onClick={() => navigate('/chat')}>
        <Badge color="error" badgeContent={unreadCount} overlap="circular" invisible={!unreadCount}>
          <ChatBubbleOutlineIcon />
        </Badge>
      </IconButton>
      <IconButton sx={{ color: isActive('/calendar') ? activeColor : inactiveColor }} onClick={() => navigate('/calendar')}> <CalendarTodayIcon /> </IconButton>
      <IconButton sx={{ color: isActive('/my') ? activeColor : inactiveColor }} onClick={() => navigate('/my')}> <PersonOutlineIcon /> </IconButton>
    </Box>
  );
};

export default BottomNav;


