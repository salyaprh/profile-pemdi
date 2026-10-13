import { useId, type ReactNode } from 'react';
import { Button, Modal } from '@idds/react';
import { useDialogInitialFocus } from './useDialogInitialFocus';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Aksi yang menghapus/membatalkan: tombol konfirmasi berwarna merah. */
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  /** Isi tambahan (mis. kolom catatan) di antara deskripsi dan tombol. */
  children?: ReactNode;
  /** id elemen yang difokuskan saat dialog terbuka; bawaannya tombol Batal (aksi teraman). */
  initialFocusId?: string;
}

/** Dialog konfirmasi berbasis Modal IDDS (role="dialog", aria-modal, judul terhubung). */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  pending = false,
  onConfirm,
  onClose,
  children,
  initialFocusId,
}: ConfirmDialogProps) {
  const cancelId = `${useId()}-batal`;
  useDialogInitialFocus(open, initialFocusId ?? cancelId);

  return (
    <Modal open={open} onClose={onClose} title={title} closeLabel="Tutup" size="sm">
      <div className="space-y-5">
        <div className="text-caption text-content-secondary">{description}</div>
        {children}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button id={cancelId} hierarchy="secondary" onClick={onClose} disabled={pending}>
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending}
            className={destructive ? 'admin-button-destructive' : undefined}
          >
            {pending ? 'Memproses…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
