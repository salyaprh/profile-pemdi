/**
 * Aturan kata sandi akun CMS: sama dengan Password::defaults() di backend
 * (App\Providers\AppServiceProvider), yang tetap menjadi penentu akhir.
 */
export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_HINT = `Minimal ${PASSWORD_MIN_LENGTH} karakter, dengan huruf besar, huruf kecil, dan angka.`;

export function validateNewPassword(password: string): string | null {
  if (!password) return 'Kata sandi wajib diisi';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter`;
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return 'Kata sandi harus memuat huruf besar dan huruf kecil';
  }
  if (!/\d/.test(password)) return 'Kata sandi harus memuat angka';
  return null;
}

// Tanpa huruf yang mudah tertukar (I, l, O, 0, 1) agar kata sandi sementara mudah disampaikan.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';

/** Bilangan acak 0 ≤ n < max tanpa bias modulo, dari generator acak yang aman (CSPRNG). */
function randomBelow(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

/** Kata sandi acak 16 karakter yang memenuhi aturan di atas, untuk akun baru dan pengaturan ulang. */
export function generatePassword(length = 16): string {
  const pick = (alphabet: string) => alphabet[randomBelow(alphabet.length)];
  const all = UPPER + LOWER + DIGITS;
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS)];
  while (chars.length < length) chars.push(pick(all));
  // Acak urutannya (Fisher–Yates) agar tiga karakter pertama tidak selalu huruf besar, kecil, angka.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomBelow(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
