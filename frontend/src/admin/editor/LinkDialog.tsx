import { useState, type FormEvent } from 'react';
import { Button, Modal, TextField } from '@idds/react';
import { useDialogInitialFocus } from '../components/useDialogInitialFocus';
import { isSafeHref, normalizeHref } from './links';

interface LinkDialogProps {
  open: boolean;
  initialHref: string;
  /** Tautan sudah terpasang pada teks terpilih: tampilkan tombol hapus. */
  editing: boolean;
  onSubmit: (href: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

export default function LinkDialog({
  open,
  initialHref,
  editing,
  onSubmit,
  onRemove,
  onClose,
}: LinkDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Ubah tautan' : 'Sisipkan tautan'}
      closeLabel="Tutup"
      size="sm"
    >
      {/* Dipasang ulang setiap dibuka agar isian mulai dari tautan yang sedang dipilih. */}
      {open && (
        <LinkForm
          initialHref={initialHref}
          editing={editing}
          onSubmit={onSubmit}
          onRemove={onRemove}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function LinkForm({
  initialHref,
  editing,
  onSubmit,
  onRemove,
  onClose,
}: Omit<LinkDialogProps, 'open'>) {
  const [href, setHref] = useState(initialHref);
  const [error, setError] = useState<string | null>(null);
  useDialogInitialFocus(true, 'editor-link-href');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Form ini dirender di dalam portal Modal, tetapi event submit tetap merambat ke form artikel
    // lewat pohon React; hentikan agar tidak ikut menyimpan artikel.
    event.stopPropagation();
    const value = normalizeHref(href);
    if (!href.trim()) return setError('Alamat tautan wajib diisi');
    if (!isSafeHref(value)) {
      return setError('Gunakan alamat https://, mailto:, atau path situs ini (diawali /)');
    }
    onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <TextField
        id="editor-link-href"
        name="href"
        label="Alamat tautan"
        placeholder="https://www.menpan.go.id/"
        helperText="Tautan ke situs lain, alamat email (mailto:), atau halaman situs ini (/portfolio)."
        value={href}
        onChange={(value) => {
          setHref(value);
          setError(null);
        }}
        status={error ? 'error' : 'neutral'}
        aria-invalid={error ? true : undefined}
        statusMessage={error ?? undefined}
        inputMode="url"
        autoComplete="off"
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <div>
          {editing && (
            <Button type="button" hierarchy="tertiary" onClick={onRemove}>
              Hapus tautan
            </Button>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" hierarchy="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit">Simpan tautan</Button>
        </div>
      </div>
    </form>
  );
}
