import { useEffect } from 'react';

/**
 * Modal IDDS memfokuskan wadah dialognya sekitar 85 ms setelah dibuka (dua requestAnimationFrame
 * lalu jeda 50 ms), sehingga autoFocus pada isian di dalamnya tertimpa. Hook ini memindahkan fokus
 * setelah jeda itu ke elemen yang paling tepat (pola WAI-ARIA Dialog): isian pertama, atau aksi
 * paling aman ("Batal") pada konfirmasi yang menghapus.
 */
const DIALOG_INITIAL_FOCUS_DELAY_MS = 150;

export function useDialogInitialFocus(open: boolean, targetId: string) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(
      () => document.getElementById(targetId)?.focus(),
      DIALOG_INITIAL_FOCUS_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [open, targetId]);
}
