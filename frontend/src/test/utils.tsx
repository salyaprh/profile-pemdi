import type { ReactElement } from 'react';
import { ToastProvider } from '@idds/react';
import { render } from '@testing-library/react';

/** Mengatur URL awal (path + query) sebelum komponen dirender. */
export function setUrl(url: string) {
  window.history.replaceState(null, '', url);
}

/** Merender dengan ToastProvider, seperti di src/main.tsx. */
export function renderWithToast(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}
