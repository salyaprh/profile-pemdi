export interface ContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

/**
 * - `sent`           : pesan diterima endpoint.
 * - `not-configured` : `VITE_CONTACT_ENDPOINT` belum diisi, pesan TIDAK dikirim.
 */
export type SendResult = 'sent' | 'not-configured';

const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT?.trim();

export async function sendContactMessage(payload: ContactMessage): Promise<SendResult> {
  if (!endpoint) {
    if (import.meta.env.DEV) {
      console.warn(
        '[contact] VITE_CONTACT_ENDPOINT belum diset (lihat .env.example); pesan tidak dikirim.',
      );
    }
    return 'not-configured';
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Gagal mengirim pesan (HTTP ${response.status})`);
  }
  return 'sent';
}
