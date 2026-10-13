import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setBrandTheme, ToastProvider } from '@idds/react';
// Inter di-self-host (IDDS memuatnya dari Google Fonts; @import itu dibuang saat build,
// lihat vite-plugins/selfHostFonts.ts). Bobot yang dipakai IDDS: 400, 500, 600.
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@idds/react/index.css';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

// Brand theme IDDS: 'inagov' | 'panrb' | 'bkn' | 'lan' | 'bgn' | 'default'
setBrandTheme('panrb');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
