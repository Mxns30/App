import React from 'react';
import { useSchool } from '../../contexts/SchoolContext';

interface AdventureSplashProps {
  onContinue: () => void;
}

const AdventureSplash: React.FC<AdventureSplashProps> = ({ onContinue }) => {
  const { currentSchool } = useSchool();
  const schoolName = currentSchool || '한양여자대학교';
  return (
    <div id="adventureSplash">
      <div className="adventure-content">
        <h1>
          {schoolName}에서<br />
          청춘을 시작해 보세요
        </h1>
        <button className="btn btn-primary" onClick={onContinue}>계속하기</button>
      </div>
    </div>
  );
};

export default AdventureSplash;
