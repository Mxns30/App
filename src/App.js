import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import './App.css';
import SplashScreen from './components/SplashScreen';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import AdventureSplash from './components/AdventureSplash';
import QRScanner from './components/QRScanner';
import LoadingSpinner from './components/LoadingSpinner';
import Notification from './components/Notification';

// Pages
import HomePage from './pages/HomePage.tsx';
import MyPage from './pages/MyPage.tsx';
import PostDetail from './pages/PostDetail.tsx';
import PostRegistration from './pages/PostRegistration.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import EditPage from './pages/EditPage.tsx';
import SearchPage from './pages/SearchPage.tsx';
// Chat Pages
import ChatPage from './pages/chat/ChatPage.tsx';
import ChatListPage from './pages/chat/ChatListPage.tsx';
// Calendar Pages
import CalendarPage from './pages/calendar/CalendarPage.tsx';
import PhotoManagerPage from './pages/calendar/PhotoManagerPage.tsx';

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

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 스플래시 스크린 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScreen('adventure');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 알림 표시 함수
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  // 로딩 표시 함수
  const showLoading = (show) => {
    setIsLoading(show);
  };

  // 로그인 성공 처리
  const handleLoginSuccess = (name) => {
    setUserName(name);
    setCurrentScreen('qr');
  };

  // QR 스캔 완료 후 메인 앱으로 이동
  const handleQRScanComplete = () => {
    setIsLoggedIn(true);
    setCurrentScreen('main');
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setUserName('');
    setIsLoggedIn(false);
    setCurrentScreen('login');
  };

  // 폼 전환 함수
  const showSignupForm = () => {
    setCurrentScreen('signup');
  };

  const showLoginForm = () => {
    setCurrentScreen('login');
  };

  // AdventureSplash에서 계속하기 버튼 클릭
  const handleAdventureContinue = () => {
    setCurrentScreen('login');
  };

  // 로그인되지 않은 경우 로그인 화면으로 리다이렉트
  if (currentScreen === 'main' && !isLoggedIn) {
    setCurrentScreen('login');
  }

  return (
    <div className="App">
      {currentScreen === 'splash' && <SplashScreen />}
      
      {currentScreen === 'adventure' && (
        <AdventureSplash onContinue={handleAdventureContinue} />
      )}
      
             {currentScreen === 'login' && (
               <div className="login-container">
                 <LoginForm 
                   onLoginSuccess={handleLoginSuccess}
                   onShowSignup={showSignupForm}
                   showNotification={showNotification}
                   showLoading={showLoading}
                 />
               </div>
             )}
             
             {currentScreen === 'signup' && (
               <div className="login-container">
                 <SignupForm 
                   onShowLogin={showLoginForm}
                   showNotification={showNotification}
                   showLoading={showLoading}
                 />
               </div>
             )}

             {currentScreen === 'qr' && (
               <QRScanner 
                 showNotification={showNotification}
                 onStartAdventure={handleQRScanComplete}
               />
             )}
      
             {currentScreen === 'main' && isLoggedIn && (
               <div className="main-app-container">
                 <ThemeProvider theme={theme}>
                   <CssBaseline />
                   <Router>
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
                       <Route path="*" element={<Navigate to="/" replace />} />
                     </Routes>
                   </Router>
                 </ThemeProvider>
               </div>
             )}
      
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

export default App;
