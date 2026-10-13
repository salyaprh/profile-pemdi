import { useState } from 'react';
import { Alert, Button } from '@idds/react';
import { uploadImage } from '../articles/api';
import ImageFileInput from './ImageFileInput';

interface CoverImageFieldProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  error?: string;
}

/** Gambar sampul artikel: diunggah langsung, lalu URL hasil unggahan disimpan bersama artikel. */
export default function CoverImageField({
  value,
  onChange,
  disabled = false,
  error,
}: CoverImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSelect = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      onChange((await uploadImage(file)).url);
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : 'Gambar gagal diunggah.');
    } finally {
      setUploading(false);
    }
  };

  const message = uploadError ?? error;

  return (
    <fieldset className="space-y-3">
      <legend className="text-caption font-medium text-content-primary">
        Gambar sampul (opsional)
      </legend>
      <p id="artikel-sampul-hint" className="text-caption-sm text-content-secondary">
        JPG, PNG, atau WebP, maksimal 5 MB. Disarankan mendatar (mis. 1600×900). Dipakai di kartu
        portofolio dan pratinjau tautan.
      </p>
      {value && (
        <img
          src={value}
          alt="Pratinjau gambar sampul"
          className="aspect-video w-full max-w-sm rounded-lg border border-stroke-primary object-cover"
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <ImageFileInput
          label="Pilih gambar sampul"
          buttonLabel={value ? 'Ganti gambar' : 'Pilih gambar'}
          onSelect={(file) => void handleSelect(file)}
          onInvalid={setUploadError}
          disabled={disabled || uploading}
          describedBy="artikel-sampul-hint"
        />
        {value && !disabled && (
          <Button
            type="button"
            hierarchy="tertiary"
            onClick={() => onChange(null)}
            disabled={uploading}
          >
            Hapus gambar
          </Button>
        )}
      </div>
      <p role="status" className="text-caption-sm text-content-secondary">
        {uploading ? 'Mengunggah gambar…' : ''}
      </p>
      {message && <Alert variant="critical" message={message} />}
    </fieldset>
  );
}
