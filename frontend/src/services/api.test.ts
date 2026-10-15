import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server, setXsrfCookie } from '../test/server';
import { ApiError, apiRequest, NETWORK_ERROR_MESSAGE } from './api';

async function catchError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('permintaan seharusnya gagal');
}

describe('apiRequest', () => {
  it('GET mengembalikan JSON dan meminta respons JSON dari Laravel', async () => {
    let accept: string | null = null;
    server.use(
      http.get('/api/contoh', ({ request }) => {
        accept = request.headers.get('accept');
        return HttpResponse.json({ ok: true });
      }),
    );

    await expect(apiRequest('/api/contoh')).resolves.toEqual({ ok: true });
    expect(accept).toBe('application/json');
  });

  it('permintaan yang mengubah data membawa token CSRF dari cookie XSRF-TOKEN', async () => {
    setXsrfCookie('token=dengan/karakter+khusus');
    let received: { token: string | null; body: unknown } | null = null;
    server.use(
      http.post('/api/contoh', async ({ request }) => {
        received = { token: request.headers.get('x-xsrf-token'), body: await request.json() };
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiRequest('/api/contoh', { method: 'POST', body: { nama: 'Siti' } });

    expect(received).toEqual({ token: 'token=dengan/karakter+khusus', body: { nama: 'Siti' } });
  });

  it('GET tidak mengirim token CSRF', async () => {
    setXsrfCookie('rahasia');
    let token: string | null = 'belum dibaca';
    server.use(
      http.get('/api/contoh', ({ request }) => {
        token = request.headers.get('x-xsrf-token');
        return HttpResponse.json({});
      }),
    );

    await apiRequest('/api/contoh');
    expect(token).toBeNull();
  });

  it('mengambil cookie CSRF lebih dulu bila belum ada', async () => {
    const calls: string[] = [];
    server.use(
      http.get('/api/csrf', () => {
        calls.push('csrf');
        setXsrfCookie('baru');
        return new HttpResponse(null, { status: 204 });
      }),
      http.post('/api/contoh', ({ request }) => {
        calls.push(`post:${request.headers.get('x-xsrf-token')}`);
        return HttpResponse.json({});
      }),
    );

    await apiRequest('/api/contoh', { method: 'POST' });
    expect(calls).toEqual(['csrf', 'post:baru']);
  });

  it('419 (token CSRF usang): ambil token baru lalu ulang tepat sekali', async () => {
    setXsrfCookie('usang');
    const tokens: (string | null)[] = [];
    server.use(
      http.get('/api/csrf', () => {
        setXsrfCookie('segar');
        return new HttpResponse(null, { status: 204 });
      }),
      http.post('/api/contoh', ({ request }) => {
        const token = request.headers.get('x-xsrf-token');
        tokens.push(token);
        return token === 'segar'
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ message: 'CSRF token mismatch.' }, { status: 419 });
      }),
    );

    await expect(apiRequest('/api/contoh', { method: 'POST' })).resolves.toEqual({ ok: true });
    expect(tokens).toEqual(['usang', 'segar']);
  });

  it('419 yang berulang tidak diulang tanpa henti', async () => {
    setXsrfCookie('usang');
    let attempts = 0;
    server.use(
      http.get('/api/csrf', () => new HttpResponse(null, { status: 204 })),
      http.post('/api/contoh', () => {
        attempts += 1;
        return HttpResponse.json({ message: 'CSRF token mismatch.' }, { status: 419 });
      }),
    );

    const error = await catchError(apiRequest('/api/contoh', { method: 'POST' }));
    expect(error.status).toBe(419);
    expect(error.message).toBe('Sesi Anda kedaluwarsa. Muat ulang halaman lalu coba lagi.');
    expect(attempts).toBe(2);
  });

  it('422: pesan pertama per kolom dari respons validasi Laravel', async () => {
    setXsrfCookie('t');
    server.use(
      http.post('/api/contoh', () =>
        HttpResponse.json(
          {
            message: 'Format email tidak valid. (and 1 more error)',
            errors: { email: ['Format email tidak valid.', 'lainnya'], password: ['Wajib.'] },
          },
          { status: 422 },
        ),
      ),
    );

    const error = await catchError(apiRequest('/api/contoh', { method: 'POST' }));
    expect(error.status).toBe(422);
    expect(error.fieldErrors).toEqual({ email: 'Format email tidak valid.', password: 'Wajib.' });
  });

  it.each([
    [401, { message: 'Unauthenticated.' }, 'Sesi Anda telah berakhir. Silakan masuk lagi.'],
    [404, { message: 'Not Found' }, 'Data tidak ditemukan.'],
    [
      500,
      { message: 'Server Error' },
      'Terjadi kesalahan di server. Coba lagi beberapa saat lagi.',
    ],
    [503, null, 'Terjadi kesalahan di server. Coba lagi beberapa saat lagi.'],
    [403, { message: 'Akses khusus Admin.' }, 'Akses khusus Admin.'],
    [403, {}, 'Anda tidak memiliki akses untuk tindakan ini.'],
  ])('status %i diterjemahkan menjadi pesan yang jelas', async (status, body, message) => {
    server.use(http.get('/api/contoh', () => HttpResponse.json(body, { status })));

    const error = await catchError(apiRequest('/api/contoh'));
    expect(error).toMatchObject({ status, message });
  });

  it('respons non-JSON (mis. halaman error proxy) tetap menjadi ApiError', async () => {
    server.use(
      http.get('/api/contoh', () => new HttpResponse('<html>Bad Gateway</html>', { status: 502 })),
    );

    const error = await catchError(apiRequest('/api/contoh'));
    expect(error.status).toBe(502);
  });

  it('jaringan putus menjadi ApiError status 0 dengan pesan koneksi', async () => {
    server.use(http.get('/api/contoh', () => HttpResponse.error()));

    const error = await catchError(apiRequest('/api/contoh'));
    expect(error).toMatchObject({ status: 0, message: NETWORK_ERROR_MESSAGE });
  });

  it('204 mengembalikan undefined', async () => {
    setXsrfCookie('t');
    server.use(http.post('/api/contoh', () => new HttpResponse(null, { status: 204 })));

    await expect(apiRequest('/api/contoh', { method: 'POST' })).resolves.toBeUndefined();
  });
});
