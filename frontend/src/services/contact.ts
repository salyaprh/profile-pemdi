import { apiRequest } from './api';

export interface ContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

/**
 * Nama kolom jebakan bot (honeypot). Kolom ini disembunyikan dari pengguna dan pembaca layar;
 * pesan yang mengisinya dianggap dari bot dan diabaikan server (tetap dijawab "diterima").
 */
export const HONEYPOT_FIELD = 'kolom_khusus';

/**
 * Token formulir dari server (waktu formulir dibuka, terenkripsi). Pesan yang dikirim terlalu cepat
 * setelah formulir dibuka diabaikan, dan token yang kedaluwarsa (lebih dari 2 jam) ditolak 422.
 */
export async function fetchContactToken(signal?: AbortSignal): Promise<string> {
  const { token } = await apiRequest<{ token: string }>('/api/contact/token', { signal });
  return token;
}

/**
 * POST /api/contact (tanpa sesi dan tanpa cookie). 202 bila diterima; 422 berisi galat per kolom
 * (aturan sama dengan src/lib/validators.ts) atau `token` kedaluwarsa; 429 bila terlalu sering.
 */
export async function sendContactMessage(
  message: ContactMessage,
  { token, honeypot }: { token: string; honeypot: string },
): Promise<void> {
  await apiRequest('/api/contact', {
    method: 'POST',
    body: { ...message, token, [HONEYPOT_FIELD]: honeypot },
    csrf: false,
  });
}
