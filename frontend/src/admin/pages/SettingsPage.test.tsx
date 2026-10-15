import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { SiteSettings } from '../../services/content';
import { testSite } from '../../test/publicApi';
import { server } from '../../test/server';
import { renderWithToast, setUrl } from '../../test/utils';
import AdminApp from '../AdminApp';
import { createAdminQueryClient } from '../queryClient';
import { adminUser, mockSession, penulisUser } from '../test-helpers';

function setup(url = '/admin/pengaturan') {
  setUrl(url);
  const user = userEvent.setup();
  renderWithToast(<AdminApp queryClient={createAdminQueryClient({ queries: { retry: false } })} />);
  return user;
}

function mockSettings() {
  const puts: SiteSettings[] = [];
  server.use(
    http.get('/api/admin/settings', () => HttpResponse.json({ data: testSite })),
    http.put('/api/admin/settings', async ({ request }) => {
      const body = (await request.json()) as SiteSettings;
      puts.push(body);
      return HttpResponse.json({ data: body });
    }),
  );
  return puts;
}

describe('pengaturan situs', () => {
  it('menampilkan nilai saat ini; tombol simpan baru aktif setelah ada perubahan', async () => {
    mockSession(adminUser);
    mockSettings();
    setup();

    expect(await screen.findByLabelText(/^Deskripsi situs/)).toHaveValue(testSite.description);
    expect(screen.getByLabelText(/^Angka 2/)).toHaveValue('28');
    expect(screen.getByLabelText(/^Keterangan 2/)).toHaveValue('Layanan terdigitalisasi');
    expect(screen.getByLabelText('Email')).toHaveValue('humas@panrb.example.go.id');
    expect(screen.getByLabelText('Instagram')).toHaveValue('https://www.instagram.com/panrb');
    expect(screen.getByLabelText('Facebook')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Simpan pengaturan' })).toBeDisabled();
  });

  it('menyimpan perubahan: kolom kosong dikirim sebagai null, spasi dipangkas', async () => {
    mockSession(adminUser);
    const puts = mockSettings();
    const user = setup();

    const stat = await screen.findByLabelText(/^Angka 2/);
    await user.clear(stat);
    await user.type(stat, '  30 ');
    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Facebook'), 'https://www.facebook.com/panrb');
    await user.click(screen.getByRole('button', { name: 'Simpan pengaturan' }));

    expect(await screen.findByText('Pengaturan tersimpan')).toBeInTheDocument();
    expect(puts).toHaveLength(1);
    expect(puts[0].hero_stats[1]).toEqual({ value: '30', label: 'Layanan terdigitalisasi' });
    expect(puts[0].contact.email).toBeNull();
    expect(puts[0].social).toEqual({
      facebook: 'https://www.facebook.com/panrb',
      instagram: 'https://www.instagram.com/panrb',
      x: null,
      youtube: 'https://www.youtube.com/@panrb',
    });
    expect(screen.getByRole('button', { name: 'Simpan pengaturan' })).toBeDisabled();
  });

  it('validasi di browser: deskripsi pendek, angka kosong, email dan tautan tidak valid', async () => {
    mockSession(adminUser);
    const puts = mockSettings();
    const user = setup();

    const description = await screen.findByLabelText(/^Deskripsi situs/);
    await user.clear(description);
    await user.type(description, 'terlalu pendek');
    await user.clear(screen.getByLabelText(/^Angka 1/));
    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), 'bukan-email');
    await user.clear(screen.getByLabelText('X (Twitter)'));
    await user.type(screen.getByLabelText('X (Twitter)'), 'http://x.com/panrb');
    await user.click(screen.getByRole('button', { name: 'Simpan pengaturan' }));

    expect(await screen.findByText('Deskripsi minimal 20 karakter')).toBeInTheDocument();
    expect(screen.getByText('Angka wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Format email tidak valid')).toBeInTheDocument();
    expect(screen.getByText('Gunakan alamat lengkap yang diawali https://')).toBeInTheDocument();
    expect(description).toHaveFocus();
    expect(puts).toEqual([]);
  });

  it('galat validasi dari server (hero_stats.0.value) tampil di kolom angka pertama', async () => {
    mockSession(adminUser);
    server.use(
      http.get('/api/admin/settings', () => HttpResponse.json({ data: testSite })),
      http.put('/api/admin/settings', () =>
        HttpResponse.json(
          {
            message: 'Data tidak valid.',
            errors: { 'hero_stats.0.value': ['Angka maksimal 10 karakter'] },
          },
          { status: 422 },
        ),
      ),
    );
    const user = setup();

    await user.type(await screen.findByLabelText(/^Angka 1/), '!');
    await user.click(screen.getByRole('button', { name: 'Simpan pengaturan' }));

    expect(await screen.findByText('Angka maksimal 10 karakter')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/^Angka 1/)).toHaveFocus());
  });

  it('Penulis tidak dapat membuka pengaturan', async () => {
    mockSession(penulisUser);
    setup();

    expect(await screen.findByText('Halaman ini khusus Admin')).toBeInTheDocument();
  });
});
