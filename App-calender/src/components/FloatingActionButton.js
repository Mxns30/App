import React from 'react';
import './FloatingActionButton.css';

const FloatingActionButton = ({ text, onClick }) => {
  return (
    <button className="calendar-pwa-floating-action-button" onClick={onClick}>
      {text}
    </button>
  );
};

export default FloatingActionButton; 