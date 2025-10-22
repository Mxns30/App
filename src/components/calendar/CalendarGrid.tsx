import React from 'react';
import './CalendarGrid.css';

interface CalendarGridProps {
  currentDate: Date;
  events: { [key: string]: { event1: string[]; event2: string[] } };
  onDateClick: (date: Date) => void;
  isToday: (date: Date) => boolean;
  getDateKey: (date: Date) => string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  currentDate, 
  events, 
  onDateClick, 
  isToday, 
  getDateKey 
}) => {
  const renderDays = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const weeks: JSX.Element[] = [];
    
    // 6주를 렌더링하여 구조를 일관되게 유지
    for (let w = 0; w < 6; w++) {
      let containsDayOfCurrentMonth = false;
      const weekDays: JSX.Element[] = [];

      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (w * 7) + d);
        
        const dayKey = getDateKey(date);
        const dayEvents = events[dayKey] || { event1: [], event2: [] };
        const hasEvents = dayEvents.event1?.length > 0 || dayEvents.event2?.length > 0;
        
        const dayElement = (
          <div
            key={d}
            className={`calendar-pwa-day ${date.getMonth() === currentDate.getMonth() ? 'calendar-pwa-current-month-day' : 'calendar-pwa-other-month'} ${isToday(date) ? 'calendar-pwa-today' : ''} ${date.getDay() === 0 ? 'calendar-pwa-sunday' : ''} ${date.getDay() === 6 ? 'calendar-pwa-saturday' : ''}`}
            onClick={() => date.getMonth() === currentDate.getMonth() && onDateClick(date)}
          >
            {date.getDate()}
            {hasEvents && <div className="calendar-pwa-event-marker"></div>}
          </div>
        );
        
        if (date.getMonth() === currentDate.getMonth()) {
          containsDayOfCurrentMonth = true;
        }
        
        weekDays.push(dayElement);
      }
      
      // 현재 월의 날짜를 포함하는 주만 렌더링
      if (containsDayOfCurrentMonth) {
        weeks.push(
          <div key={w} className="calendar-pwa-week">
            {weekDays}
          </div>
        );
      }
    }
    
    return weeks;
  };

  return (
    <div className="calendar-pwa-grid">
      <div className="calendar-pwa-weekdays">
        <div className="calendar-pwa-sunday-header">일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div className="calendar-pwa-saturday-header">토</div>
      </div>
      <div className="calendar-pwa-days">
        {renderDays()}
      </div>
    </div>
  );
};

export default CalendarGrid;
