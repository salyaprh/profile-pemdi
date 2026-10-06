export interface ValidationResult {
  isValid: boolean;
  message: string;
}

const valid: ValidationResult = { isValid: true, message: '' };
const invalid = (message: string): ValidationResult => ({
  isValid: false,
  message,
});

export function validateName(name: string): ValidationResult {
  if (!name.trim()) return invalid('Nama lengkap wajib diisi');
  if (name.trim().length < 3) return invalid('Minimal 3 karakter');
  return valid;
}

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) return invalid('Email wajib diisi');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return invalid('Format email tidak valid');
  }
  return valid;
}

/** Nomor ponsel bersifat opsional; nilai kosong atau hanya kode negara dianggap valid. */
export function validateOptionalPhone(phone: string): ValidationResult {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (!cleaned || /^\+?\d{1,3}$/.test(cleaned)) return valid;
  if (!/^\+?\d{10,15}$/.test(cleaned)) {
    return invalid('Nomor ponsel harus 10-15 digit angka');
  }
  return valid;
}

export function validateSubject(subject: string): ValidationResult {
  if (!subject.trim()) return invalid('Subjek wajib diisi');
  return valid;
}

export const MESSAGE_MAX_LENGTH = 1000;

export function validateMessage(message: string): ValidationResult {
  const trimmed = message.trim();
  if (!trimmed) return invalid('Pesan wajib diisi');
  if (trimmed.length < 10) return invalid('Pesan minimal 10 karakter');
  if (message.length > MESSAGE_MAX_LENGTH) {
    return invalid(`Pesan maksimal ${MESSAGE_MAX_LENGTH} karakter`);
  }
  return valid;
}
