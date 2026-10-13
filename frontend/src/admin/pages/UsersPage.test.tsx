import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../test/server';
import { renderWithToast, setUrl } from '../../test/utils';
import AdminApp from '../AdminApp';
import { createAdminQueryClient } from '../queryClient';
import { adminUser, managedUser, mockSession, penulisUser } from '../test-helpers';
import type { ManagedUser } from '../users/api';

function setup(url: string) {
  setUrl(url);
  const user = userEvent.setup();
  renderWithToast(<AdminApp queryClient={createAdminQueryClient({ queries: { retry: false } })} />);
  return user;
}

const rows: ManagedUser[] = [
  managedUser({
    id: 1,
    name: 'Admin Utama',
    email: 'admin@pemdi.test',
    role: 'admin',
    role_label: 'Admin',
    articles_count: 0,
    last_login_at: '2026-10-13T03:00:00+00:00',
  }),
  managedUser({
    id: 2,
    name: 'Siti Penulis',
    email: 'siti@pemdi.test',
    articles_count: 4,
    must_change_password: true,
  }),
  managedUser({ id: 3, name: 'Budi Lama', email: 'budi@pemdi.test', is_active: false }),
];

function mockList() {
  const requests: string[] = [];
  server.use(
    http.get('/api/admin/users', ({ request }) => {
      requests.push(new URL(request.url).search);
      return HttpResponse.json({
        data: rows,
        meta: { current_page: 1, last_page: 1, per_page: 20, total: rows.length },
      });
    }),
  );
  return requests;
}

describe('daftar pengguna', () => {
  it('menampilkan nama bertaut, email, peran, status, jumlah artikel, dan terakhir masuk', async () => {
    mockSession(adminUser);
    mockList();
    setup('/admin/pengguna');

    const table = await screen.findByRole('table');
    expect(within(table).getByRole('link', { name: 'Siti Penulis' })).toHaveAttribute(
      'href',
      '/admin/pengguna/2',
    );
    const siti = within(table)
      .getByRole('link', { name: 'Siti Penulis' })
      .closest('tr') as HTMLElement;
    expect(within(siti).getByText('siti@pemdi.test')).toBeInTheDocument();
    expect(within(siti).getByText('Penulis')).toBeInTheDocument();
    expect(within(siti).getByText('Aktif')).toBeInTheDocument();
    expect(within(siti).getByText('Belum mengganti kata sandi sementara')).toBeInTheDocument();
    expect(within(siti).getByText('Belum pernah')).toBeInTheDocument();
    const budi = within(table)
      .getByRole('link', { name: 'Budi Lama' })
      .closest('tr') as HTMLElement;
    expect(within(budi).getByText('Nonaktif')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('3 pengguna');
  });

  it('filter status dan pencarian tersimpan di URL dan dikirim ke API', async () => {
    mockSession(adminUser);
    const requests = mockList();
    const user = setup('/admin/pengguna');

    const group = await screen.findByRole('group', { name: 'Filter status akun' });
    await user.click(within(group).getByRole('button', { name: 'Nonaktif' }));
    await waitFor(() => expect(window.location.search).toBe('?status=nonaktif'));
    await waitFor(() => expect(requests.at(-1)).toBe('?status=nonaktif'));

    await user.type(screen.getByLabelText('Cari nama atau email'), 'budi');
    await waitFor(() => expect(window.location.search).toBe('?status=nonaktif&cari=budi'));
    await waitFor(() => expect(requests.at(-1)).toBe('?status=nonaktif&cari=budi'));
  });

  it('Penulis tidak dapat membuka daftar pengguna dan tidak melihat menunya', async () => {
    mockSession(penulisUser);
    setup('/admin/pengguna');

    expect(await screen.findByText('Halaman ini khusus Admin')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pengguna' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Akun saya' })).toBeInTheDocument();
  });

  it('tanpa hasil: pesan kosong', async () => {
    mockSession(adminUser);
    server.use(
      http.get('/api/admin/users', () =>
        HttpResponse.json({
          data: [],
          meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
        }),
      ),
    );
    setup('/admin/pengguna?cari=tidakada');

    expect(await screen.findByText('Tidak ada pengguna yang cocok')).toBeInTheDocument();
  });

  it('gagal memuat: pesan galat dan tombol coba lagi', async () => {
    mockSession(adminUser);
    server.use(http.get('/api/admin/users', () => HttpResponse.json({}, { status: 500 })));
    setup('/admin/pengguna');

    expect(await screen.findByText('Daftar pengguna gagal dimuat')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  });
});
