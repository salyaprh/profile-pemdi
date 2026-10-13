import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'id' | 'children'
> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  /** Pilihan awal tanpa nilai (mis. "Semua kategori" atau "Pilih kategori"). */
  placeholder?: string;
  helperText?: ReactNode;
  error?: string;
  /** id elemen <select>; bawaannya dibuat otomatis. Diperlukan bila fokus diatur dari luar. */
  id?: string;
}

/**
 * Pilihan tunggal berupa <select> bawaan browser dengan label, teks bantuan, dan pesan galat
 * yang terhubung (aria-describedby). Dipakai menggantikan SelectDropdown IDDS yang bukan
 * <select> asli sehingga tidak ramah keyboard dan pembaca layar untuk pilihan sederhana.
 */
export default function SelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  helperText,
  error,
  id: providedId,
  required,
  ...rest
}: SelectFieldProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const describedBy = error ? `${id}-galat` : helperText ? `${id}-bantuan` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-caption font-medium text-content-primary">
        {label}
        {required && <span className="text-negative-600"> *</span>}
      </label>
      <select
        {...rest}
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="admin-select"
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${id}-galat`} className="text-caption-sm text-negative-600">
          {error}
        </p>
      ) : (
        helperText && (
          <p id={`${id}-bantuan`} className="text-caption-sm text-content-secondary">
            {helperText}
          </p>
        )
      )}
    </div>
  );
}
