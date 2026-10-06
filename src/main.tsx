import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setBrandTheme, ToastProvider } from '@idds/react';
import '@idds/react/index.css';
import './index.css';
import App from './App.tsx';

// Brand theme IDDS: 'inagov' | 'panrb' | 'bkn' | 'lan' | 'bgn' | 'default'
setBrandTheme('panrb');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
