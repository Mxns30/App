import React, { useState } from 'react';
import './EventModal.css';

const EventModal = ({ date, events, onClose, onAddEvent, onUpdateEvent, onDeleteEvent, monthNames }) => {
  const [event1Input, setEvent1Input] = useState('');
  const [event2Input, setEvent2Input] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);

  const handleSubmit = (eventType, e) => {
    e.preventDefault();
    const inputValue = eventType === 'event1' ? event1Input : event2Input;
    if (inputValue.trim()) {
      onAddEvent(eventType, inputValue.trim());
      if (eventType === 'event1') {
        setEvent1Input('');
      } else {
        setEvent2Input('');
      }
    }
  };

  const handleEdit = (eventType, index, text) => {
    setEditingEvent({ type: eventType, index, text });
  };

  const handleSaveEdit = (eventType, index) => {
    if (editingEvent && editingEvent.type === eventType && editingEvent.index === index) {
      onUpdateEvent(eventType, index, editingEvent.text);
      setEditingEvent(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
  };

  const handleEditChange = (e) => {
    setEditingEvent(prev => ({ ...prev, text: e.target.value }));
  };

  const renderEventList = (eventType, events) => {
    if (!events || events.length === 0) {
      return <li className="calendar-pwa-no-events">내용이 없습니다.</li>;
    }

    return events.map((event, index) => {
      const isEditing = editingEvent && editingEvent.type === eventType && editingEvent.index === index;
      
      return (
        <li key={index} className={isEditing ? 'calendar-pwa-is-editing' : ''}>
          {isEditing ? (
            <>
              <input
                type="text"
                className="calendar-pwa-edit-event-input"
                value={editingEvent.text}
                onChange={handleEditChange}
              />
              <div className="calendar-pwa-edit-controls">
                <button
                  className="calendar-pwa-save-event-btn"
                  onClick={() => handleSaveEdit(eventType, index)}
                  data-type={eventType}
                  data-index={index}
                >
                  저장
                </button>
                <button className="calendar-pwa-cancel-edit-btn" onClick={handleCancelEdit}>
                  ×
                </button>
              </div>
            </>
          ) : (
            <>
              <span onClick={() => handleEdit(eventType, index, event)}>
                {event}
              </span>
              <button
                className="calendar-pwa-delete-event-btn"
                onClick={() => onDeleteEvent(eventType, index)}
                data-type={eventType}
                data-index={index}
              >
                ×
              </button>
            </>
          )}
        </li>
      );
    });
  };

  return (
    <div className="calendar-pwa-modal" onClick={onClose}>
      <div className="calendar-pwa-modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="calendar-pwa-close-btn" onClick={onClose}>&times;</span>
        <h3 className="calendar-pwa-modal-date">
          {date.getFullYear()}년 {date.getMonth() + 1}월 {date.getDate()}일
        </h3>
        
        <div className="calendar-pwa-event-sections-container">
          <div className="calendar-pwa-event-section">
            <h4>거래</h4>
            <ul className="calendar-pwa-event-list">
              {renderEventList('event1', events.event1)}
            </ul>
            <form 
              className="calendar-pwa-add-event-form"
              onSubmit={(e) => handleSubmit('event1', e)}
            >
              <input
                type="text"
                placeholder="거래 추가"
                value={event1Input}
                onChange={(e) => setEvent1Input(e.target.value)}
                required
              />
              <button type="submit">추가</button>
            </form>
          </div>
          
          <div className="calendar-pwa-event-section">
            <h4>투두리스트</h4>
            <ul className="calendar-pwa-event-list">
              {renderEventList('event2', events.event2)}
            </ul>
            <form 
              className="calendar-pwa-add-event-form"
              onSubmit={(e) => handleSubmit('event2', e)}
            >
              <input
                type="text"
                placeholder="투두리스트 추가"
                value={event2Input}
                onChange={(e) => setEvent2Input(e.target.value)}
                required
              />
              <button type="submit">추가</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal; 