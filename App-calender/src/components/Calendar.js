import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import EventModal from './EventModal';
import FloatingActionButton from './FloatingActionButton';
import './Calendar.css';

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState({});

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  // 이벤트 로드
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendar-pwa-events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  // 이벤트 저장
  const saveEvents = (newEvents) => {
    setEvents(newEvents);
    localStorage.setItem('calendar-pwa-events', JSON.stringify(newEvents));
  };

  // 이전 월
  const previousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  // 다음 월
  const nextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // 날짜 클릭
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  // 이벤트 추가
  const addEvent = (eventType, text) => {
    if (!selectedDate) return;

    const dateKey = getDateKey(selectedDate);
    const currentEvents = events[dateKey] || { event1: [], event2: [] };
    
    const newEvents = {
      ...events,
      [dateKey]: {
        ...currentEvents,
        [eventType]: [...currentEvents[eventType], text]
      }
    };

    saveEvents(newEvents);
  };

  // 이벤트 수정
  const updateEvent = (eventType, index, newText) => {
    if (!selectedDate) return;

    const dateKey = getDateKey(selectedDate);
    const currentEvents = events[dateKey] || { event1: [], event2: [] };
    
    const newEvents = {
      ...events,
      [dateKey]: {
        ...currentEvents,
        [eventType]: currentEvents[eventType].map((event, i) => 
          i === parseInt(index) ? newText : event
        )
      }
    };

    saveEvents(newEvents);
  };

  // 이벤트 삭제
  const deleteEvent = (eventType, index) => {
    if (!selectedDate) return;

    const dateKey = getDateKey(selectedDate);
    const currentEvents = events[dateKey] || { event1: [], event2: [] };
    
    const newEvents = {
      ...events,
      [dateKey]: {
        ...currentEvents,
        [eventType]: currentEvents[eventType].filter((_, i) => i !== parseInt(index))
      }
    };

    saveEvents(newEvents);
  };

  // 날짜 키 생성
  const getDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 오늘 날짜 확인
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="calendar-pwa-container">
      <img src="/cat.png" alt="인사하는 고양이" className="calendar-pwa-cat-image" />
      
      <CalendarHeader 
        currentDate={currentDate}
        monthNames={monthNames}
        onPreviousMonth={previousMonth}
        onNextMonth={nextMonth}
      />
      
      <CalendarGrid 
        currentDate={currentDate}
        events={events}
        onDateClick={handleDateClick}
        isToday={isToday}
        getDateKey={getDateKey}
      />

      <FloatingActionButton 
        text="시간표"
        onClick={() => navigate('/photo')}
      />

      {isModalOpen && selectedDate && (
        <EventModal
          date={selectedDate}
          events={events[getDateKey(selectedDate)] || { event1: [], event2: [] }}
          onClose={closeModal}
          onAddEvent={addEvent}
          onUpdateEvent={updateEvent}
          onDeleteEvent={deleteEvent}
          monthNames={monthNames}
        />
      )}
    </div>
  );
};

export default Calendar; 