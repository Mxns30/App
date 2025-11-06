import React, { useState } from 'react';
import QRScanner from './QRScanner';
import AdventureSplash from './AdventureSplash';

interface HomeScreenProps {
  userName: string;
  onLogout: () => void;
  showNotification: (message: string, type?: string) => void;
  onContinueToMain?: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ userName, onLogout, showNotification, onContinueToMain }) => {
  const [showAdventure, setShowAdventure] = useState(false);

  const handleStartAdventure = () => {
    console.log('HomeScreen handleStartAdventure called');
    setShowAdventure(true);
  };

  const handleContinue = () => {
    console.log('HomeScreen handleContinue called');
    setShowAdventure(false);
    if (onContinueToMain) {
      onContinueToMain();
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
