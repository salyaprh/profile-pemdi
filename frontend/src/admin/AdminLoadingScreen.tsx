import { Spinner } from '@idds/react';

/** Layar tunggu panel admin (memuat kode admin atau memeriksa sesi). */
export default function AdminLoadingScreen() {
  return (
    <div
      role="status"
      className="flex min-h-screen items-center justify-center bg-background-secondary text-content-secondary"
    >
      <Spinner size={32} spinnerOnly />
      <span className="sr-only">Memuat panel admin</span>
    </div>
  );
}
