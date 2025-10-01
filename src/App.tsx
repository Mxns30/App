import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
// Auth Components
import SplashScreen from './components/auth/SplashScreen';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import LoadingSpinner from './components/auth/LoadingSpinner';
import Notification from './components/auth/Notification';
import QRScanner from './components/auth/QRScanner';
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
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [userName, setUserName] = useState('');
  const [showAdventure, setShowAdventure] = useState(false);

  // 스플래시 스크린 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScreen('login');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
    // 로그인한 사용자 ID를 localStorage에 저장
    localStorage.setItem('userId', name);
    console.log('로그인 성공, 사용자 ID 저장:', name);
    setCurrentScreen('home');
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setUserName('');
    // 로그아웃 시 userId 제거
    localStorage.removeItem('userId');
    console.log('로그아웃, 사용자 ID 제거');
    setCurrentScreen('login');
  };

  // 폼 전환 함수
  const showSignupForm = () => {
    setCurrentScreen('signup');
  };

  const showLoginForm = () => {
    setCurrentScreen('login');
  };

  // 모험 시작 처리 - QR코드 스캔 후 두 번째 스플래시 화면으로
  const handleStartAdventure = () => {
    console.log('handleStartAdventure called');
    setShowAdventure(true);
  };

  // 계속하기 처리 - 두 번째 스플래시 화면에서 메인 앱으로 이동
  const handleContinue = () => {
    setShowAdventure(false);
    setCurrentScreen('main');
  };

  // 로그인 화면들
  if (currentScreen === 'splash') {
    return <SplashScreen />;
  }

  if (currentScreen === 'login') {
    return (
      <div className="auth-container">
        <LoginForm 
          onLoginSuccess={handleLoginSuccess}
          onShowSignup={showSignupForm}
          showNotification={showNotification}
          showLoading={showLoading}
        />
        {isLoading && <LoadingSpinner />}
        {notification.show && (
          <Notification 
            message={notification.message} 
            type={notification.type} 
          />
        )}
      </div>
    );
  }

  if (currentScreen === 'signup') {
    return (
      <div className="auth-container">
        <SignupForm 
          onShowLogin={showLoginForm}
          showNotification={showNotification}
          showLoading={showLoading}
        />
        {isLoading && <LoadingSpinner />}
        {notification.show && (
          <Notification 
            message={notification.message} 
            type={notification.type} 
          />
        )}
      </div>
    );
  }

  if (currentScreen === 'home') {
    return (
      <div className="auth-container">
        <HomeScreen 
          userName={userName}
          onLogout={handleLogout}
          showNotification={showNotification}
          onContinueToMain={() => setCurrentScreen('main')}
        />
        {isLoading && <LoadingSpinner />}
        {notification.show && (
          <Notification 
            message={notification.message} 
            type={notification.type} 
          />
        )}
      </div>
    );
  }

  if (showAdventure) {
    return <AdventureSplash onContinue={handleContinue} />;
  }

  // 메인 앱 (로그인 후)
  if (currentScreen === 'main') {
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
  }

  return null;
};

export default App; 