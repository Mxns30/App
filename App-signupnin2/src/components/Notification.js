import React from 'react';

const Notification = ({ message, type = 'success' }) => {
  return (
    <div className={`notification show ${type}`} id="notification">
      {message}
    </div>
  );
};

export default Notification;
