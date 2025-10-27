import React, { useState, useEffect } from 'react';
import './App.css';
import SplashScreen from './components/SplashScreen';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import HomeScreen from './components/HomeScreen';
import LoadingSpinner from './components/LoadingSpinner';
import Notification from './components/Notification';

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [userName, setUserName] = useState('');

  // 스플래시 스크린 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScreen('login');
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
    setCurrentScreen('home');
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setUserName('');
    setCurrentScreen('login');
  };

  // 폼 전환 함수
  const showSignupForm = () => {
    setCurrentScreen('signup');
  };

  const showLoginForm = () => {
    setCurrentScreen('login');
  };

  return (
    <div className="App">
      {currentScreen === 'splash' && <SplashScreen />}
      
      {currentScreen === 'login' && (
        <LoginForm 
          onLoginSuccess={handleLoginSuccess}
          onShowSignup={showSignupForm}
          showNotification={showNotification}
          showLoading={showLoading}
        />
      )}
      
      {currentScreen === 'signup' && (
        <SignupForm 
          onShowLogin={showLoginForm}
          showNotification={showNotification}
          showLoading={showLoading}
        />
      )}
      
      {currentScreen === 'home' && (
        <HomeScreen 
          userName={userName}
          onLogout={handleLogout}
          showNotification={showNotification}
        />
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
