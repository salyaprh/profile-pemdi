import { useId, useRef, type ChangeEvent } from 'react';
import { Button } from '@idds/react';
import { IconUpload } from '@tabler/icons-react';
import { ALLOWED_IMAGE_TYPES, validateImageFile } from '../articles/api';

interface ImageFileInputProps {
  /** id tombol (mis. untuk fokus awal dialog). */
  buttonId?: string;
  label: string;
  buttonLabel: string;
  onSelect: (file: File) => void;
  onInvalid: (message: string) => void;
  disabled?: boolean;
  describedBy?: string;
}

/**
 * Tombol pilih gambar. Memakai <input type="file"> asli (tersembunyi tetapi tetap dapat diakses
 * lewat label) agar bekerja di semua browser, pembaca layar, dan kamera ponsel.
 */
export default function ImageFileInput({
  buttonId,
  label,
  buttonLabel,
  onSelect,
  onInvalid,
  disabled = false,
  describedBy,
}: ImageFileInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // memilih berkas yang sama lagi tetap memicu change
    if (!file) return;
    const error = validateImageFile(file);
    if (error) onInvalid(error);
    else onSelect(file);
  };

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={handleChange}
        disabled={disabled}
        aria-describedby={describedBy}
        className="sr-only"
        tabIndex={-1}
      />
      <Button
        id={buttonId}
        type="button"
        hierarchy="secondary"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-describedby={describedBy}
        prefixIcon={<IconUpload size={18} aria-hidden="true" />}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}
