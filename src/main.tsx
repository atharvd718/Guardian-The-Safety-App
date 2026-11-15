import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { AppAuthProvider } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { App } from './App';
import './index.css';

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppAuthProvider>
        <App />
      </AppAuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
