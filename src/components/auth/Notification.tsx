import React from 'react';

interface NotificationProps {
  message: string;
  type?: string;
}

const Notification: React.FC<NotificationProps> = ({ message, type = 'success' }) => {
  return (
    <div className={`notification show ${type}`} id="notification">
      {message}
    </div>
  );
};

export default Notification;
