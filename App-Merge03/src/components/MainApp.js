import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
// Pages
import HomePage from '../pages/HomePage';
import PostDetail from '../pages/PostDetail';
import PostRegistration from '../pages/PostRegistration';
import EditPage from '../pages/EditPage';
import ChatPage from '../pages/ChatPage';
import ChatListPage from '../pages/ChatListPage';
import CalendarPage from '../pages/CalendarPage';
import PhotoManagerPage from '../pages/PhotoManagerPage';
import MyPage from '../pages/MyPage';
import ProfilePage from '../pages/ProfilePage';
import SearchPage from '../pages/SearchPage';

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const MainApp = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/post/:postId" element={<PostDetail />} />
        <Route path="/post/registration" element={<PostRegistration />} />
        <Route path="/post/edit/:postId" element={<EditPage />} />
        <Route path="/chat" element={<ChatListPage />} />
        <Route path="/chat/:roomId" element={<ChatPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/calendar/photo" element={<PhotoManagerPage />} />
        <Route path="/my" element={<MyPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/search" element={<SearchPage />} />
        {/* 다른 라우트들은 필요에 따라 추가 */}
      </Routes>
    </ThemeProvider>
  );
};

export default MainApp;
