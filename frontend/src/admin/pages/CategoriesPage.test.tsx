import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../test/server';
import { renderWithToast, setUrl } from '../../test/utils';
import AdminApp from '../AdminApp';
import { createAdminQueryClient } from '../queryClient';
import { adminUser, categories, mockSession, penulisUser } from '../test-helpers';

function setup() {
  setUrl('/admin/kategori');
  const user = userEvent.setup();
  renderWithToast(<AdminApp queryClient={createAdminQueryClient({ queries: { retry: false } })} />);
  return user;
}

const row = (name: string) =>
  screen.getByText(name, { selector: 'p' }).closest('li') as HTMLElement;

describe('halaman kategori', () => {
  it('menampilkan kategori dengan jumlah artikel; yang masih dipakai tidak bisa dihapus', async () => {
    mockSession(adminUser);
    setup();

    expect(await screen.findByText('13 artikel · /layanan-publik')).toBeInTheDocument();
    const used = within(row('Layanan Publik')).getByRole('button', {
      name: 'Hapus kategori Layanan Publik',
    });
    expect(used).toBeDisabled();
    expect(used).toHaveAccessibleDescription(
      'Tidak dapat dihapus karena masih dipakai 13 artikel.',
    );
    expect(
      within(row('Panduan Pengguna')).getByRole('button', {
        name: 'Hapus kategori Panduan Pengguna',
      }),
    ).toBeEnabled();
  });

  it('menambah kategori: validasi di browser lalu dikirim ke API', async () => {
    mockSession(adminUser);
    const posted: unknown[] = [];
    server.use(
      http.post('/api/admin/categories', async ({ request }) => {
        posted.push(await request.json());
        return HttpResponse.json(
          { data: { id: 3, name: 'Inovasi', slug: 'inovasi', articles_count: 0 } },
          { status: 201 },
        );
      }),
    );
    const user = setup();

    await user.click(await screen.findByRole('button', { name: 'Tambah kategori' }));
    expect(screen.getByText('Nama kategori wajib diisi')).toBeInTheDocument();
    expect(posted).toEqual([]);

    await user.type(screen.getByLabelText('Kategori baru'), '  Inovasi ');
    await user.click(screen.getByRole('button', { name: 'Tambah kategori' }));

    expect(await screen.findByText('Kategori “Inovasi” ditambahkan')).toBeInTheDocument();
    expect(posted).toEqual([{ name: 'Inovasi' }]);
    expect(screen.getByLabelText('Kategori baru')).toHaveValue('');
  });

  it('nama ganda ditolak server dan pesannya tampil di kolom', async () => {
    mockSession(adminUser);
    server.use(
      http.post('/api/admin/categories', () =>
        HttpResponse.json(
          {
            message: 'Kategori dengan nama ini sudah ada.',
            errors: { name: ['Kategori dengan nama ini sudah ada.'] },
          },
          { status: 422 },
        ),
      ),
    );
    const user = setup();

    await user.type(await screen.findByLabelText('Kategori baru'), 'Layanan Publik');
    await user.click(screen.getByRole('button', { name: 'Tambah kategori' }));

    expect(await screen.findByText('Kategori dengan nama ini sudah ada.')).toBeInTheDocument();
  });

  it('mengganti nama lewat isian di baris itu', async () => {
    mockSession(adminUser);
    const updated: unknown[] = [];
    server.use(
      http.put('/api/admin/categories/2', async ({ request }) => {
        updated.push(await request.json());
        return HttpResponse.json({ data: { ...categories[1], name: 'Panduan' } });
      }),
    );
    const user = setup();

    await user.click(
      await screen.findByRole('button', { name: 'Ubah nama kategori Panduan Pengguna' }),
    );
    const input = screen.getByLabelText('Nama baru untuk Panduan Pengguna');
    expect(input).toHaveFocus();
    await user.clear(input);
    await user.type(input, 'Panduan');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Nama kategori diperbarui')).toBeInTheDocument();
    expect(updated).toEqual([{ name: 'Panduan' }]);
  });

  it('menghapus kategori setelah konfirmasi; fokus awal dialog di tombol Batal', async () => {
    mockSession(adminUser);
    let deleted = false;
    server.use(
      http.delete('/api/admin/categories/2', () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = setup();

    await user.click(
      await screen.findByRole('button', { name: 'Hapus kategori Panduan Pengguna' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Hapus kategori?' });
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Batal' })).toHaveFocus(),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Hapus kategori' }));

    expect(await screen.findByText('Kategori “Panduan Pengguna” dihapus')).toBeInTheDocument();
    expect(deleted).toBe(true);
  });

  it('Penulis yang membuka halaman ini melihat pemberitahuan khusus Admin', async () => {
    mockSession(penulisUser);
    setup();

    expect(await screen.findByText('Halaman ini khusus Admin')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tambah kategori' })).not.toBeInTheDocument();
  });
});
