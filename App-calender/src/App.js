import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Calendar from './components/Calendar';
import PhotoManager from './components/PhotoManager';
import './App.css';

function App() {
  return (
    <Router>
      <div className="calendar-pwa-app">
        <Routes>
          <Route path="/" element={<Calendar />} />
          <Route path="/photo" element={<PhotoManager />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 