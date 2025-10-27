import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import BottomNav from '../../components/BottomNav';
import Calendar from '../../components/calendar/Calendar';

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #ffffff, #ACEDD9, #99EFB3)',
      padding: '0',
      margin: '0',
      paddingBottom: '80px' // 하단 네비게이션 공간 확보
    }}>
      <Calendar />
      
      <BottomNav />
    </div>
  );
};

export default CalendarPage;
