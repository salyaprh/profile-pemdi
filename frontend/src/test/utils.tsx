import type { ReactElement } from 'react';
import { ToastProvider } from '@idds/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createPublicQueryClient } from '../services/queryClient';

/** Mengatur URL awal (path + query) sebelum komponen dirender. */
export function setUrl(url: string) {
  window.history.replaceState(null, '', url);
}

/** Merender dengan ToastProvider, seperti di src/main.tsx. */
export function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

/** Klien data publik untuk uji: tanpa percobaan ulang dan tanpa cache antaruji. */
export function testQueryClient() {
  return createPublicQueryClient({ queries: { retry: false, staleTime: 0 } });
}

/** Merender bagian situs publik (komponen yang mengambil data API) beserta provider-nya. */
export function renderPublic(ui: ReactElement) {
  return render(
    <ToastProvider>
      <QueryClientProvider client={testQueryClient()}>{ui}</QueryClientProvider>
    </ToastProvider>,
  );
}
