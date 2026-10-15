import { useState, type FormEvent } from 'react';
import { Alert, Button, Modal, TextField } from '@idds/react';
import { uploadImage } from '../articles/api';
import ImageFileInput from '../components/ImageFileInput';
import { useDialogInitialFocus } from '../components/useDialogInitialFocus';
import type { UploadedMedia } from '../articles/types';

interface ImageDialogProps {
  open: boolean;
  onInsert: (image: { src: string; alt: string }) => void;
  onClose: () => void;
}

export default function ImageDialog({ open, onInsert, onClose }: ImageDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Sisipkan gambar" closeLabel="Tutup" size="md">
      {open && <ImageForm onInsert={onInsert} onClose={onClose} />}
    </Modal>
  );
}

/**
 * Gambar diunggah begitu dipilih (lalu di-encode ulang server), dan pratinjau memakai URL hasil
 * unggahan. Pratinjau lokal blob: tidak dipakai karena CSP img-src hanya mengizinkan 'self'.
 */
function ImageForm({ onInsert, onClose }: Omit<ImageDialogProps, 'open'>) {
  const [media, setMedia] = useState<UploadedMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [alt, setAlt] = useState('');
  const [altError, setAltError] = useState<string | null>(null);
  useDialogInitialFocus(true, 'editor-image-pilih');

  const handleSelect = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      setMedia(await uploadImage(file));
      if (!alt) setAlt(file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Gambar gagal diunggah.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation(); // jangan ikut menyimpan form artikel (lihat LinkDialog)
    if (!media) return setUploadError('Pilih gambar terlebih dahulu.');
    if (alt.trim().length < 3) return setAltError('Teks alternatif minimal 3 karakter');
    onInsert({ src: media.url, alt: alt.trim() });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-3">
        <p id="editor-image-hint" className="text-caption text-content-secondary">
          JPG, PNG, atau WebP, maksimal 5 MB. Gambar diperkecil otomatis dan data lokasi (EXIF)
          dihapus.
        </p>
        <ImageFileInput
          buttonId="editor-image-pilih"
          label="Pilih gambar untuk isi artikel"
          buttonLabel={media ? 'Ganti gambar' : 'Pilih gambar'}
          onSelect={(file) => void handleSelect(file)}
          onInvalid={setUploadError}
          disabled={uploading}
          describedBy="editor-image-hint"
        />
        <p role="status" className="text-caption text-content-secondary">
          {uploading ? 'Mengunggah gambar…' : media ? 'Gambar siap disisipkan.' : ''}
        </p>
        {uploadError && <Alert variant="critical" message={uploadError} />}
        {media && (
          <img
            src={media.url}
            alt=""
            className="max-h-56 w-auto rounded-lg border border-stroke-primary object-contain"
          />
        )}
      </div>

      <TextField
        id="editor-image-alt"
        name="alt"
        label="Teks alternatif"
        helperText="Jelaskan isi gambar untuk pengguna pembaca layar, mis. “Menteri PANRB membuka rapat koordinasi”."
        value={alt}
        onChange={(value) => {
          setAlt(value);
          setAltError(null);
        }}
        status={altError ? 'error' : 'neutral'}
        aria-invalid={altError ? true : undefined}
        statusMessage={altError ?? undefined}
        maxLength={200}
        required
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" hierarchy="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={uploading}>
          Sisipkan gambar
        </Button>
      </div>
    </form>
  );
}
