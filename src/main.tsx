import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import { MusicProvider } from './contexts/MusicContext.tsx';
import { API_BASE_URL } from './lib/api';
import './index.css';

(function preconnectApiOrigin() {
  try {
    const origin = new URL(API_BASE_URL).origin;
    if (origin === window.location.origin) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = '';
    document.head.appendChild(link);
  } catch {
    // Best-effort only.
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MusicProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MusicProvider>
  </StrictMode>,
);
