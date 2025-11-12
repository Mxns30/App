import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { SchoolProvider } from './contexts/SchoolContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <SchoolProvider>
        <App />
      </SchoolProvider>
    </BrowserRouter>
  </React.StrictMode>
); 