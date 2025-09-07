import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
// Pages
import HomePage from './pages/HomePage';
import MyPage from './pages/MyPage';
import PostDetail from './pages/PostDetail';
import PostRegistration from './pages/PostRegistration';
import ProfilePage from './pages/ProfilePage';
import EditPage from './pages/EditPage';
import SearchPage from './pages/SearchPage';
// Chat Pages
import ChatPage from './pages/chat/ChatPage';
import ChatListPage from './pages/chat/ChatListPage';
// Calendar Pages
import CalendarPage from './pages/calendar/CalendarPage';
import PhotoManagerPage from './pages/calendar/PhotoManagerPage';

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

const App: React.FC = () => {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/my" element={<MyPage />} />
        <Route path="/post/:postId" element={<PostDetail />} />
        <Route path="/post/registration" element={<PostRegistration />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/post/edit/:postId" element={<EditPage />} />
        <Route path="/search" element={<SearchPage />} />
                    {/* Chat Routes */}
            <Route path="/chat" element={<ChatListPage />} />
            <Route path="/chat/:roomId" element={<ChatPage />} />
            {/* Calendar Routes */}
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/calendar/photo" element={<PhotoManagerPage />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App; 