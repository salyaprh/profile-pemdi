import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../test/server';
import { renderWithToast, setUrl } from '../../test/utils';
import type { ActivityEntry } from '../activity/api';
import AdminApp from '../AdminApp';
import { createAdminQueryClient } from '../queryClient';
import { adminUser, mockSession, penulisUser } from '../test-helpers';

const entries: ActivityEntry[] = [
  {
    id: 3,
    action: 'login_gagal',
    description: 'Percobaan masuk gagal untuk x@pemdi.test.',
    user_name: null,
    ip_address: '203.0.113.7',
    created_at: '2026-10-13T03:05:00+00:00',
  },
  {
    id: 2,
    action: 'artikel_dibuat',
    description: 'Membuat artikel "Integrasi Layanan".',
    user_name: 'Siti Penulis',
    ip_address: '203.0.113.8',
    created_at: '2026-10-13T03:00:00+00:00',
  },
];

function setup(url: string) {
  setUrl(url);
  const user = userEvent.setup();
  renderWithToast(<AdminApp queryClient={createAdminQueryClient({ queries: { retry: false } })} />);
  return user;
}

function mockActivity() {
  const requests: string[] = [];
  server.use(
    http.get('/api/admin/activity', ({ request }) => {
      const search = new URL(request.url).search;
      requests.push(search);
      const data = search.includes('kelompok=artikel') ? [entries[1]] : entries;
      return HttpResponse.json({
        data,
        meta: { current_page: 1, last_page: 1, per_page: 30, total: data.length },
      });
    }),
  );
  return requests;
}

describe('halaman aktivitas', () => {
  it('menampilkan waktu, pelaku, deskripsi, dan alamat IP; pelaku tak dikenal diberi keterangan', async () => {
    mockSession(adminUser);
    mockActivity();
    setup('/admin/aktivitas');

    const table = await screen.findByRole('table');
    const failed = within(table)
      .getByText(/Percobaan masuk gagal untuk/)
      .closest('tr') as HTMLElement;
    expect(within(failed).getByText('Tidak diketahui')).toBeInTheDocument();
    expect(within(failed).getByText('203.0.113.7')).toBeInTheDocument();
    const created = within(table)
      .getByText(/Membuat artikel/)
      .closest('tr') as HTMLElement;
    expect(within(created).getByText('Siti Penulis')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 catatan');
    // Hanya bisa dibaca: tidak ada tombol aksi pada baris.
    expect(within(table).queryByRole('button')).not.toBeInTheDocument();
  });

  it('filter jenis tersimpan di URL dan dikirim ke API', async () => {
    mockSession(adminUser);
    const requests = mockActivity();
    const user = setup('/admin/aktivitas');

    const group = await screen.findByRole('group', { name: 'Filter jenis aktivitas' });
    await user.click(within(group).getByRole('button', { name: 'Artikel' }));

    await waitFor(() => expect(window.location.search).toBe('?kelompok=artikel'));
    await waitFor(() => expect(requests.at(-1)).toBe('?kelompok=artikel'));
    expect(await screen.findByText('1 catatan')).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: 'Artikel' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('kelompok yang tidak dikenal di URL diperlakukan sebagai "Semua"', async () => {
    mockSession(adminUser);
    const requests = mockActivity();
    setup('/admin/aktivitas?kelompok=ngawur');

    await screen.findByRole('table');
    expect(requests).toEqual(['']);
  });

  it('Penulis tidak dapat membuka log aktivitas', async () => {
    mockSession(penulisUser);
    setup('/admin/aktivitas');

    expect(await screen.findByText('Halaman ini khusus Admin')).toBeInTheDocument();
  });
});
