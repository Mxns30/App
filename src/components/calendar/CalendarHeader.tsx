import React from 'react';
import './CalendarHeader.css';

interface CalendarHeaderProps {
  currentDate: Date;
  monthNames: string[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ 
  currentDate, 
  monthNames, 
  onPreviousMonth, 
  onNextMonth 
}) => {
  return (
    <div className="calendar-pwa-header">
      <button className="calendar-pwa-nav-btn" onClick={onPreviousMonth}>&lt;</button>
      <h1 className="calendar-pwa-month-year">
        {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
      </h1>
      <button className="calendar-pwa-nav-btn" onClick={onNextMonth}>&gt;</button>
    </div>
  );
};

export default CalendarHeader;
