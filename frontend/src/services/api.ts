/**
 * Klien API backend (Laravel) di origin yang sama: sesi disimpan di cookie HttpOnly, dan setiap
 * permintaan yang mengubah data membawa token CSRF dari cookie XSRF-TOKEN (header X-XSRF-TOKEN).
 * Tidak ada token yang disimpan di localStorage.
 */

export class ApiError extends Error {
  readonly status: number;
  /** Pesan pertama per kolom dari respons validasi Laravel (422/429). */
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  signal?: AbortSignal;
}

const XSRF_COOKIE = 'XSRF-TOKEN';

export const NETWORK_ERROR_MESSAGE =
  'Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.';

function readCookie(name: string): string | null {
  const entry = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

/** Pesan bawaan Laravel untuk status ini berbahasa Inggris/teknis, jadi selalu diganti. */
const fixedMessages: Record<number, string> = {
  401: 'Sesi Anda telah berakhir. Silakan masuk lagi.',
  404: 'Data tidak ditemukan.',
  419: 'Sesi Anda kedaluwarsa. Muat ulang halaman lalu coba lagi.',
};

function messageFor(status: number, serverMessage: unknown): string {
  if (fixedMessages[status]) return fixedMessages[status];
  if (status >= 500) return 'Terjadi kesalahan di server. Coba lagi beberapa saat lagi.';
  if (typeof serverMessage === 'string' && serverMessage) return serverMessage;
  if (status === 403) return 'Anda tidak memiliki akses untuk tindakan ini.';
  if (status === 429) return 'Terlalu banyak permintaan. Coba lagi beberapa saat lagi.';
  return 'Permintaan tidak dapat diproses.';
}

function toApiError(status: number, data: unknown): ApiError {
  const payload = (typeof data === 'object' && data !== null ? data : {}) as {
    message?: unknown;
    errors?: unknown;
  };

  const fieldErrors: Record<string, string> = {};
  if (typeof payload.errors === 'object' && payload.errors !== null) {
    for (const [field, messages] of Object.entries(payload.errors)) {
      if (Array.isArray(messages) && typeof messages[0] === 'string') {
        fieldErrors[field] = messages[0];
      }
    }
  }

  return new ApiError(status, messageFor(status, payload.message), fieldErrors);
}

function send(path: string, method: Method, body: unknown, signal?: AbortSignal) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = readCookie(XSRF_COOKIE);
  if (method !== 'GET' && token) headers['X-XSRF-TOKEN'] = token;

  return fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
    signal,
  });
}

/** Memastikan cookie XSRF-TOKEN ada (dipasang backend pada respons /api/csrf). */
async function refreshCsrfCookie(signal?: AbortSignal) {
  await fetch('/api/csrf', { credentials: 'same-origin', signal });
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> {
  const mutating = method !== 'GET';
  let response: Response;

  try {
    if (mutating && !readCookie(XSRF_COOKIE)) await refreshCsrfCookie(signal);
    response = await send(path, method, body, signal);

    // 419: token CSRF tidak cocok lagi (mis. sesi berganti di tab lain). Ambil token baru, ulang sekali.
    if (response.status === 419 && mutating) {
      await refreshCsrfCookie(signal);
      response = await send(path, method, body, signal);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }

  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, data);
  return data as T;
}
