import { describe, expect, it, vi } from 'vitest';
import type { ContactMessage } from './contact';

const payload: ContactMessage = {
  name: 'Budi Santoso',
  email: 'budi@instansi.go.id',
  phone: '',
  subject: 'Kolaborasi',
  message: 'Halo, kami ingin berdiskusi.',
};

async function load(endpoint: string) {
  // contact.ts membaca VITE_CONTACT_ENDPOINT saat modul dimuat.
  vi.resetModules();
  vi.stubEnv('VITE_CONTACT_ENDPOINT', endpoint);
  return import('./contact');
}

describe('sendContactMessage', () => {
  it('endpoint belum diset: mengembalikan not-configured, tidak memanggil fetch, dan memperingatkan di dev', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { sendContactMessage } = await load('');

    await expect(sendContactMessage(payload)).resolves.toBe('not-configured');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('VITE_CONTACT_ENDPOINT'));
  });

  it('endpoint hanya spasi dianggap belum diset', async () => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { sendContactMessage } = await load('   ');
    await expect(sendContactMessage(payload)).resolves.toBe('not-configured');
  });

  it('mengirim POST JSON ke endpoint dan mengembalikan sent', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    const { sendContactMessage } = await load('/api/contact');

    await expect(sendContactMessage(payload)).resolves.toBe('sent');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/contact');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it('memangkas spasi pada endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    const { sendContactMessage } = await load('  /api/contact  ');

    await sendContactMessage(payload);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/contact');
  });

  it.each([400, 429, 500, 503])('respons HTTP %i dilempar sebagai error', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
    const { sendContactMessage } = await load('/api/contact');
    await expect(sendContactMessage(payload)).rejects.toThrow(`HTTP ${status}`);
  });

  it('kegagalan jaringan diteruskan sebagai error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const { sendContactMessage } = await load('/api/contact');
    await expect(sendContactMessage(payload)).rejects.toThrow('Failed to fetch');
  });
});
