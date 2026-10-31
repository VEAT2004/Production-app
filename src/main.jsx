import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { LangProvider } from './context/LangContext.jsx';
import './index.css';
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <LangProvider>
        <App/>
      </LangProvider>
    </AuthProvider>
  </BrowserRouter>);
