import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server, setXsrfCookie } from '../test/server';
import { ApiError } from './api';
import { fetchContactToken, sendContactMessage, type ContactMessage } from './contact';

const payload: ContactMessage = {
  name: 'Budi Santoso',
  email: 'budi@instansi.go.id',
  phone: '',
  subject: 'Kolaborasi',
  message: 'Halo, kami ingin berdiskusi.',
};

describe('fetchContactToken', () => {
  it('mengambil token formulir dari /api/contact/token', async () => {
    await expect(fetchContactToken()).resolves.toBe('token-formulir-uji');
  });
});

describe('sendContactMessage', () => {
  it('POST JSON ke /api/contact berisi pesan, token, dan kolom jebakan bot', async () => {
    let body: unknown;
    let contentType: string | null = null;
    server.use(
      http.post('/api/contact', async ({ request }) => {
        body = await request.json();
        contentType = request.headers.get('Content-Type');
        return HttpResponse.json({ message: 'Pesan diterima.' }, { status: 202 });
      }),
    );

    await sendContactMessage(payload, { token: 't', honeypot: '' });

    expect(contentType).toBe('application/json');
    expect(body).toEqual({ ...payload, token: 't', kolom_khusus: '' });
  });

  it('tidak membawa token CSRF meski cookie XSRF-TOKEN ada (endpoint tanpa sesi)', async () => {
    setXsrfCookie('token-sesi-admin');
    let xsrf: string | null = 'belum diperiksa';
    server.use(
      http.post('/api/contact', ({ request }) => {
        xsrf = request.headers.get('X-XSRF-TOKEN');
        return HttpResponse.json({}, { status: 202 });
      }),
    );

    await sendContactMessage(payload, { token: 't', honeypot: '' });

    expect(xsrf).toBeNull();
  });

  it('galat validasi diteruskan sebagai ApiError 422 berisi galat per kolom', async () => {
    server.use(
      http.post('/api/contact', () =>
        HttpResponse.json(
          { message: 'Data tidak valid.', errors: { email: ['Format email tidak valid'] } },
          { status: 422 },
        ),
      ),
    );

    const error = await sendContactMessage(payload, { token: 't', honeypot: '' }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 422,
      fieldErrors: { email: 'Format email tidak valid' },
    });
  });

  it('kegagalan jaringan menjadi ApiError berstatus 0', async () => {
    server.use(http.post('/api/contact', () => HttpResponse.error()));
    await expect(sendContactMessage(payload, { token: 't', honeypot: '' })).rejects.toMatchObject({
      status: 0,
    });
  });
});
