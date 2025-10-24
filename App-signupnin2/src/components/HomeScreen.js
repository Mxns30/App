import React, { useState } from 'react';
import QRScanner from './QRScanner';
import AdventureSplash from './AdventureSplash';

const HomeScreen = ({ userName, onLogout, showNotification }) => {
  const [showAdventure, setShowAdventure] = useState(false);

  const handleStartAdventure = () => {
    setShowAdventure(true);
  };

  const handleContinue = () => {
    setShowAdventure(false);
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
