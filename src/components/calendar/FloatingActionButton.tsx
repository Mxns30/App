import React from 'react';
import './FloatingActionButton.css';

interface FloatingActionButtonProps {
  text: string;
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ text, onClick }) => {
  return (
    <button className="calendar-pwa-floating-action-button" onClick={onClick}>
      {text}
    </button>
  );
};

export default FloatingActionButton;
