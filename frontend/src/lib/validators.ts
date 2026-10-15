export interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Aturan formulir kontak. Backend (App\Http\Requests\ContactMessageRequest) memakai aturan yang
 * sama; keduanya diuji dengan kasus yang sama di contact-validation-cases.json agar tidak menyimpang.
 */
export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254;
export const SUBJECT_MAX_LENGTH = 150;
export const MESSAGE_MAX_LENGTH = 1000;

const valid: ValidationResult = { isValid: true, message: '' };
const invalid = (message: string): ValidationResult => ({
  isValid: false,
  message,
});

export function validateName(name: string): ValidationResult {
  if (!name.trim()) return invalid('Nama lengkap wajib diisi');
  if (name.trim().length < 3) return invalid('Minimal 3 karakter');
  if (name.trim().length > NAME_MAX_LENGTH) return invalid(`Maksimal ${NAME_MAX_LENGTH} karakter`);
  return valid;
}

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) return invalid('Email wajib diisi');
  if (email.trim().length > EMAIL_MAX_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return invalid('Format email tidak valid');
  }
  return valid;
}

const cleanPhone = (phone: string) => phone.replace(/[\s\-()]/g, '');

/**
 * `PhoneInput` mengisi kode negara otomatis (mis. "+62"). Nilai dengan paling banyak 3 angka
 * dianggap belum ada nomor yang diketik, sehingga tidak divalidasi dan tidak dikirim.
 */
export function isEmptyPhone(phone: string): boolean {
  return /^\+?\d{0,3}$/.test(cleanPhone(phone));
}

/** Nomor ponsel bersifat opsional; nilai kosong atau hanya kode negara dianggap valid. */
export function validateOptionalPhone(phone: string): ValidationResult {
  if (isEmptyPhone(phone)) return valid;
  if (!/^\+?\d{10,15}$/.test(cleanPhone(phone))) {
    return invalid('Nomor ponsel harus 10-15 digit angka');
  }
  return valid;
}

export function validateSubject(subject: string): ValidationResult {
  if (!subject.trim()) return invalid('Subjek wajib diisi');
  if (subject.trim().length > SUBJECT_MAX_LENGTH) {
    return invalid(`Subjek maksimal ${SUBJECT_MAX_LENGTH} karakter`);
  }
  return valid;
}

export function validateMessage(message: string): ValidationResult {
  const trimmed = message.trim();
  if (!trimmed) return invalid('Pesan wajib diisi');
  if (trimmed.length < 10) return invalid('Pesan minimal 10 karakter');
  if (trimmed.length > MESSAGE_MAX_LENGTH) {
    return invalid(`Pesan maksimal ${MESSAGE_MAX_LENGTH} karakter`);
  }
  return valid;
}
