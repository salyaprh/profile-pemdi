import { useEffect } from 'react';
import { setNavigationBlocker } from '../lib/router';

export const UNSAVED_CHANGES_MESSAGE = 'Perubahan belum disimpan. Tinggalkan halaman ini?';

/**
 * Selama ada perubahan yang belum disimpan: minta konfirmasi sebelum berpindah halaman di dalam
 * aplikasi, dan tampilkan peringatan bawaan browser saat tab ditutup atau dimuat ulang.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warnBeforeUnload);
    const release = setNavigationBlocker(() => window.confirm(UNSAVED_CHANGES_MESSAGE));

    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload);
      release();
    };
  }, [dirty]);
}
