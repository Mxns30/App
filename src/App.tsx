import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { AuthProvider } from './contexts/AuthContext';
// Auth Components
import SplashScreen from './components/auth/SplashScreen';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import LoadingSpinner from './components/auth/LoadingSpinner';
import Notification from './components/auth/Notification';
import AdventureSplash from './components/auth/AdventureSplash';
import HomeScreen from './components/auth/HomeScreen';
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
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState(() => {
    return localStorage.getItem('currentScreen') || 'splash';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('userName') || '';
  });
  const [showAdventure, setShowAdventure] = useState(false);

  // 초기 진입 시 스플래시에서 로그인 화면으로 전환
  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        setCurrentScreen('login');
        localStorage.setItem('currentScreen', 'login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // currentScreen이 바뀔 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('currentScreen', currentScreen);
  }, [currentScreen]);

  // userName 바뀔 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('userName', userName);
  }, [userName]);

  // 알림 표시 함수
  const showNotification = (message: string, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  // 로딩 표시 함수
  const showLoading = (show: boolean) => {
    setIsLoading(show);
  };

  // 로그인 성공 처리
  const handleLoginSuccess = (name: string) => {
    setUserName(name);
    setCurrentScreen('home');
    localStorage.setItem('userName', name);
    localStorage.setItem('currentScreen', 'home');
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setUserName('');
    setCurrentScreen('login');
    localStorage.removeItem('userName');
    localStorage.setItem('currentScreen', 'login');
  };

  // 폼 전환 함수
  const showSignupForm = () => {
    setCurrentScreen('signup');
  };

  const showLoginForm = () => {
    setCurrentScreen('login');
  };

  // 모험 시작 처리
  const handleStartAdventure = () => {
    console.log('handleStartAdventure called');
    setShowAdventure(true);
  };

  // 계속하기 처리
  const handleContinue = () => {
    setShowAdventure(false);
    setCurrentScreen('main');
  };

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {currentScreen === 'splash' && <SplashScreen />}
        {currentScreen === 'login' && (
          <div className="auth-container">
            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              onShowSignup={showSignupForm}
              showNotification={showNotification}
              showLoading={showLoading}
            />
            {isLoading && <LoadingSpinner />}
            {notification.show && (
              <Notification message={notification.message} type={notification.type} />
            )}
          </div>
        )}
        {currentScreen === 'signup' && (
          <div className="auth-container">
            <SignupForm
              onShowLogin={showLoginForm}
              showNotification={showNotification}
              showLoading={showLoading}
            />
            {isLoading && <LoadingSpinner />}
            {notification.show && (
              <Notification message={notification.message} type={notification.type} />
            )}
          </div>
        )}
        {currentScreen === 'home' && (
          <div className="auth-container">
            <HomeScreen
              userName={userName}
              onLogout={handleLogout}
              showNotification={showNotification}
              onContinueToMain={() => setCurrentScreen('main')}
            />
            {isLoading && <LoadingSpinner />}
            {notification.show && (
              <Notification message={notification.message} type={notification.type} />
            )}
          </div>
        )}
        {showAdventure && currentScreen !== 'main' && <AdventureSplash onContinue={handleContinue} />}
        {currentScreen === 'main' && (
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
        )}
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
