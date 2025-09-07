import React, { useState } from 'react';
import QRScanner from './QRScanner';
import AdventureSplash from './AdventureSplash';

const HomeScreen = ({ userName, onLogout, showNotification, onEnterMainApp }) => {
  const [showAdventure, setShowAdventure] = useState(false);

  const handleStartAdventure = () => {
    setShowAdventure(true);
  };

  const handleContinue = () => {
    console.log('AdventureSplash 계속하기 버튼 클릭됨');
    setShowAdventure(false);
    // 메인 앱으로 전환
    if (onEnterMainApp) {
      console.log('메인 앱으로 전환 중...');
      onEnterMainApp();
    } else {
      console.log('onEnterMainApp 함수가 없습니다');
    }
  };

  if (showAdventure) {
    return <AdventureSplash onContinue={handleContinue} />;
  }

  return (
    <div className="home-container" id="homeScreen">
      <div className="home-header">
        <h1>청춘마켓</h1>
        <p>환영합니다, <span id="userName">{userName}</span>님!</p>
      </div>
      
      <div className="home-content">
        <QRScanner showNotification={showNotification} onStartAdventure={handleStartAdventure} />
      </div>
      
      <div className="home-footer">
        <button className="btn btn-secondary" onClick={onLogout}>로그아웃</button>
      </div>
    </div>
  );
};

export default HomeScreen;
