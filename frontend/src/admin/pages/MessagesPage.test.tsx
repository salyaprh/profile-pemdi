import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../test/server';
import { renderWithToast, setUrl } from '../../test/utils';
import AdminApp from '../AdminApp';
import type { ContactMessageDetail } from '../messages/api';
import { createAdminQueryClient } from '../queryClient';
import { adminUser, mockSession, penulisUser } from '../test-helpers';

const unreadMessage: ContactMessageDetail = {
  id: 5,
  name: 'Budi Santoso',
  email: 'budi@instansi.go.id',
  phone: '+6281234567890',
  subject: 'Kolaborasi program',
  preview: 'Halo, kami ingin berdiskusi',
  message: 'Halo, kami ingin berdiskusi.\nBaris kedua <b>bukan HTML</b>.',
  received_at: '2026-10-13T03:00:00+00:00',
  read_at: null,
};

const readMessage: ContactMessageDetail = {
  ...unreadMessage,
  id: 4,
  subject: 'Pertanyaan data',
  preview: 'Mohon informasi',
  read_at: '2026-10-12T03:00:00+00:00',
};

const toSummary = ({
  id,
  name,
  email,
  subject,
  preview,
  received_at,
  read_at,
}: ContactMessageDetail) => ({ id, name, email, subject, preview, received_at, read_at });

function setup(url: string) {
  setUrl(url);
  const user = userEvent.setup();
  renderWithToast(<AdminApp queryClient={createAdminQueryClient({ queries: { retry: false } })} />);
  return user;
}

function mockList() {
  const requests: string[] = [];
  server.use(
    http.get('/api/admin/messages', ({ request }) => {
      const search = new URL(request.url).search;
      requests.push(search);
      // Daftar tidak memuat isi lengkap dan nomor ponsel.
      const data = (
        search.includes('belum-dibaca') ? [unreadMessage] : [unreadMessage, readMessage]
      ).map(toSummary);
      return HttpResponse.json({
        data,
        meta: { current_page: 1, last_page: 1, per_page: 20, total: data.length },
      });
    }),
  );
  return requests;
}

function mockDetail(message = unreadMessage) {
  const patches: unknown[] = [];
  let current = message;
  server.use(
    http.get(`/api/admin/messages/${message.id}`, () => HttpResponse.json({ data: current })),
    http.patch(`/api/admin/messages/${message.id}`, async ({ request }) => {
      const body = (await request.json()) as { read: boolean };
      patches.push(body);
      current = { ...current, read_at: body.read ? '2026-10-13T04:00:00+00:00' : null };
      return HttpResponse.json({ data: current });
    }),
  );
  return patches;
}

describe('kotak masuk pesan', () => {
  it('menampilkan pesan dengan subjek bertaut, pengirim, potongan isi, dan penanda belum dibaca', async () => {
    mockSession(adminUser);
    mockList();
    setup('/admin/pesan');

    const link = await screen.findByRole('link', { name: 'Kolaborasi program' });
    expect(link).toHaveAttribute('href', '/admin/pesan/5');
    const item = link.closest('li') as HTMLElement;
    expect(within(item).getByText('Budi Santoso · budi@instansi.go.id')).toBeInTheDocument();
    expect(within(item).getByText('Halo, kami ingin berdiskusi')).toBeInTheDocument();
    expect(within(item).getByText('Belum dibaca')).toBeInTheDocument();
    const readItem = screen.getByRole('link', { name: 'Pertanyaan data' }).closest('li');
    expect(within(readItem as HTMLElement).queryByText('Belum dibaca')).not.toBeInTheDocument();
    expect(screen.getByText('2 pesan')).toBeInTheDocument();
  });

  it('filter "Belum dibaca" tersimpan di URL dan dikirim ke API', async () => {
    mockSession(adminUser);
    const requests = mockList();
    const user = setup('/admin/pesan');

    const group = await screen.findByRole('group', { name: 'Filter pesan' });
    await user.click(within(group).getByRole('button', { name: 'Belum dibaca' }));

    await waitFor(() => expect(window.location.search).toBe('?status=belum-dibaca'));
    await waitFor(() => expect(requests.at(-1)).toBe('?status=belum-dibaca'));
    expect(within(group).getByRole('button', { name: 'Belum dibaca' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('tanpa pesan belum dibaca: pesan kosong yang jelas', async () => {
    mockSession(adminUser);
    server.use(
      http.get('/api/admin/messages', () =>
        HttpResponse.json({
          data: [],
          meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
        }),
      ),
    );
    setup('/admin/pesan?status=belum-dibaca');

    expect(await screen.findByText('Semua pesan sudah dibaca')).toBeInTheDocument();
  });

  it('Penulis tidak dapat membuka kotak masuk dan tidak melihat menu Pesan', async () => {
    mockSession(penulisUser);
    setup('/admin/pesan');

    expect(await screen.findByText('Halaman ini khusus Admin')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pesan' })).not.toBeInTheDocument();
  });
});

describe('detail pesan', () => {
  it('menampilkan isi sebagai teks biasa dan menandai dibaca sekali saat dibuka', async () => {
    mockSession(adminUser);
    const patches = mockDetail();
    setup('/admin/pesan/5');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Kolaborasi program' }),
    ).toBeInTheDocument();
    // Markup di isi pesan tidak dirender sebagai HTML.
    expect(screen.getByText(/Baris kedua <b>bukan HTML<\/b>\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'budi@instansi.go.id' })).toHaveAttribute(
      'href',
      'mailto:budi@instansi.go.id',
    );
    expect(screen.getByRole('link', { name: '+6281234567890' })).toHaveAttribute(
      'href',
      'tel:+6281234567890',
    );
    expect(screen.getByRole('link', { name: 'Balas lewat email' })).toHaveAttribute(
      'href',
      'mailto:budi%40instansi.go.id?subject=Re%3A%20Kolaborasi%20program',
    );

    await waitFor(() => expect(patches).toEqual([{ read: true }]));
    expect(await screen.findByRole('button', { name: 'Tandai belum dibaca' })).toBeInTheDocument();
  });

  it('pesan yang sudah dibaca tidak ditandai ulang; "Tandai belum dibaca" mengirim read: false', async () => {
    mockSession(adminUser);
    const patches = mockDetail(readMessage);
    const user = setup('/admin/pesan/4');

    await user.click(await screen.findByRole('button', { name: 'Tandai belum dibaca' }));

    expect(await screen.findByText('Ditandai belum dibaca')).toBeInTheDocument();
    expect(patches).toEqual([{ read: false }]);
    expect(screen.getByRole('button', { name: 'Tandai sudah dibaca' })).toBeInTheDocument();
  });

  it('menghapus pesan setelah konfirmasi lalu kembali ke kotak masuk', async () => {
    mockSession(adminUser);
    mockDetail(readMessage);
    mockList();
    let deleted = false;
    server.use(
      http.delete('/api/admin/messages/4', () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = setup('/admin/pesan/4');

    await user.click(await screen.findByRole('button', { name: 'Hapus pesan' }));
    const dialog = await screen.findByRole('dialog', { name: 'Hapus pesan?' });
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Batal' })).toHaveFocus(),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Hapus pesan' }));

    expect(await screen.findByText('Pesan dihapus')).toBeInTheDocument();
    expect(deleted).toBe(true);
    expect(window.location.pathname).toBe('/admin/pesan');
  });

  it('pesan yang sudah tidak ada: pemberitahuan dan tautan kembali', async () => {
    mockSession(adminUser);
    server.use(
      http.get('/api/admin/messages/99', () =>
        HttpResponse.json({ message: 'Data tidak ditemukan.' }, { status: 404 }),
      ),
    );
    setup('/admin/pesan/99');

    expect(await screen.findByText('Pesan tidak ditemukan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kembali ke pesan masuk' })).toHaveAttribute(
      'href',
      '/admin/pesan',
    );
  });
});
