import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  setBrandTheme,
  ConfirmationProvider,
  ToastProvider,
} from '@idds/react';
import '@idds/react/index.css';
import './index.css';
import App from './App.tsx';

// Set brand theme (pilih: 'inagov', 'pan-rb', 'bkn', 'lan', 'default')
setBrandTheme('panrb');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfirmationProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ConfirmationProvider>
  </StrictMode>
);
