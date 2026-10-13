import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../test/server';
import { renderWithToast, setUrl } from '../../test/utils';
import AdminApp from '../AdminApp';
import { createAdminQueryClient } from '../queryClient';
import { adminUser, makeArticle, mockSession, penulisUser } from '../test-helpers';

function mockList(total = 2) {
  const requests: string[] = [];
  server.use(
    http.get('/api/admin/articles', ({ request }) => {
      requests.push(new URL(request.url).search);
      const data =
        total === 0
          ? []
          : [
              makeArticle({ id: 7, title: 'Integrasi Layanan Digital ASN' }),
              makeArticle({
                id: 8,
                title: 'Panduan SPBE',
                status: 'ditinjau',
                status_label: 'Menunggu tinjauan',
                author: { id: 3, name: 'Budi' },
              }),
            ];
      return HttpResponse.json({
        data,
        meta: { current_page: 1, last_page: 3, per_page: 15, total },
      });
    }),
  );
  return requests;
}

function setup(url: string) {
  setUrl(url);
  const user = userEvent.setup();
  renderWithToast(<AdminApp queryClient={createAdminQueryClient({ queries: { retry: false } })} />);
  return user;
}

describe('daftar artikel', () => {
  it('Admin melihat tabel artikel dengan kolom penulis, status, dan tautan edit', async () => {
    mockSession(adminUser);
    mockList();
    setup('/admin/artikel');

    const table = await screen.findByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Penulis' })).toBeInTheDocument();
    expect(
      within(table).getByRole('link', { name: 'Integrasi Layanan Digital ASN' }),
    ).toHaveAttribute('href', '/admin/artikel/7');
    expect(within(table).getByText('Menunggu tinjauan')).toBeInTheDocument();
    expect(within(table).getByText('Budi')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 artikel');
    expect(screen.getByRole('navigation', { name: 'Paginasi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sampah' })).toBeInTheDocument();
  });

  it('Penulis tidak melihat kolom penulis maupun filter Sampah', async () => {
    mockSession(penulisUser);
    mockList();
    setup('/admin/artikel');

    await screen.findByRole('table');
    expect(screen.queryByRole('columnheader', { name: 'Penulis' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sampah' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Kategori' })).not.toBeInTheDocument();
  });

  it('filter status dan kategori tersimpan di URL dan dikirim ke API', async () => {
    mockSession(adminUser);
    const requests = mockList();
    const user = setup('/admin/artikel?halaman=2');

    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Menunggu tinjauan' }));
    await waitFor(() => expect(window.location.search).toBe('?status=ditinjau'));

    await user.selectOptions(screen.getByLabelText('Kategori'), 'Layanan Publik');
    await waitFor(() => expect(window.location.search).toBe('?status=ditinjau&kategori=1'));
    await waitFor(() => expect(requests.at(-1)).toBe('?status=ditinjau&kategori=1'));
    expect(requests[0]).toBe('?page=2');
  });

  it('pencarian judul menunggu jeda mengetik sebelum memanggil API', async () => {
    mockSession(adminUser);
    const requests = mockList();
    const user = setup('/admin/artikel');

    await screen.findByRole('table');
    await user.type(screen.getByLabelText('Cari judul'), 'SPBE');

    await waitFor(() => expect(window.location.search).toBe('?cari=SPBE'));
    await waitFor(() => expect(requests.at(-1)).toBe('?cari=SPBE'));
    expect(requests.filter((query) => query.startsWith('?cari=S'))).toEqual(['?cari=SPBE']);
  });

  it('tanpa hasil: pesan kosong dan tombol hapus filter', async () => {
    mockSession(adminUser);
    mockList(0);
    const user = setup('/admin/artikel?status=terbit');

    expect(await screen.findByText('Tidak ada artikel yang cocok')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hapus filter' }));
    expect(window.location.search).toBe('');
  });

  it('gagal memuat: pesan galat dan tombol coba lagi', async () => {
    mockSession(adminUser);
    server.use(http.get('/api/admin/articles', () => HttpResponse.json({}, { status: 500 })));
    setup('/admin/artikel');

    expect(await screen.findByText('Daftar artikel gagal dimuat')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  });

  it('menu Artikel aktif di sidebar', async () => {
    mockSession(adminUser);
    mockList();
    setup('/admin/artikel');

    const [sidebar] = await screen.findAllByRole('navigation', { name: 'Menu admin' });
    expect(within(sidebar).getByRole('link', { name: 'Artikel' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(sidebar).getByRole('link', { name: 'Kategori' })).toBeInTheDocument();
  });
});
