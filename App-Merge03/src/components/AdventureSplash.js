import React from 'react';

const AdventureSplash = ({ onContinue }) => {
  return (
    <div id="adventureSplash">
      <div className="adventure-content">
        <h1>
          한양여자대학교에서 <br/>
          청춘을 시작해 보세요
        </h1>
        <button className="btn btn-primary" onClick={onContinue}>계속하기</button>
      </div>
    </div>
  );
};

export default AdventureSplash;
