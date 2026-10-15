import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../test/server';
import { renderWithToast, setUrl } from '../../test/utils';
import AdminApp from '../AdminApp';
import { validateNewPassword } from '../account/password';
import { createAdminQueryClient } from '../queryClient';
import { adminUser, managedUser, mockSession } from '../test-helpers';

function setup(url: string) {
  setUrl(url);
  const user = userEvent.setup();
  renderWithToast(<AdminApp queryClient={createAdminQueryClient({ queries: { retry: false } })} />);
  return user;
}

const password = () => screen.getByLabelText(/^Kata sandi sementara/);

describe('tambah pengguna', () => {
  it('validasi di browser sebelum dikirim, fokus ke kolom pertama yang salah', async () => {
    mockSession(adminUser);
    const posted: unknown[] = [];
    server.use(
      http.post('/api/admin/users', async ({ request }) => {
        posted.push(await request.json());
        return HttpResponse.json({}, { status: 500 });
      }),
    );
    const user = setup('/admin/pengguna/baru');

    await user.click(await screen.findByRole('button', { name: 'Buat akun' }));

    expect(screen.getByText('Nama lengkap wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Email wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi wajib diisi')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nama lengkap/)).toHaveFocus();
    expect(posted).toEqual([]);

    await user.type(screen.getByLabelText(/^Nama lengkap/), 'Budi Santoso');
    await user.type(screen.getByLabelText(/^Email/), 'budi@pemdi.test');
    await user.type(password(), 'pendek');
    await user.click(screen.getByRole('button', { name: 'Buat akun' }));
    expect(await screen.findByText('Kata sandi minimal 12 karakter')).toBeInTheDocument();
    expect(posted).toEqual([]);
  });

  it('"Buat kata sandi acak" mengisi kolom dengan kata sandi yang memenuhi aturan', async () => {
    mockSession(adminUser);
    const user = setup('/admin/pengguna/baru');

    await user.click(await screen.findByRole('button', { name: 'Buat kata sandi acak' }));

    expect(validateNewPassword((password() as HTMLInputElement).value)).toBeNull();
  });

  it('membuat akun, menampilkan toast, dan membuka halaman akun itu', async () => {
    mockSession(adminUser);
    const posted: unknown[] = [];
    server.use(
      http.post('/api/admin/users', async ({ request }) => {
        posted.push(await request.json());
        return HttpResponse.json(
          {
            data: managedUser({
              id: 9,
              name: 'Budi Santoso',
              email: 'budi@pemdi.test',
              must_change_password: true,
            }),
          },
          { status: 201 },
        );
      }),
      http.get('/api/admin/users/9', () =>
        HttpResponse.json({
          data: managedUser({ id: 9, name: 'Budi Santoso', must_change_password: true }),
        }),
      ),
    );
    const user = setup('/admin/pengguna/baru');

    await user.type(await screen.findByLabelText(/^Nama lengkap/), '  Budi Santoso ');
    await user.type(screen.getByLabelText(/^Email/), 'budi@pemdi.test');
    await user.selectOptions(screen.getByLabelText('Peran'), 'Admin');
    await user.type(password(), 'KataSandiSementara2026');
    await user.click(screen.getByRole('button', { name: 'Buat akun' }));

    expect(await screen.findByText('Akun Budi Santoso dibuat')).toBeInTheDocument();
    expect(posted).toEqual([
      {
        name: 'Budi Santoso',
        email: 'budi@pemdi.test',
        role: 'admin',
        password: 'KataSandiSementara2026',
      },
    ]);
    await waitFor(() => expect(window.location.pathname).toBe('/admin/pengguna/9'));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Budi Santoso' }),
    ).toBeInTheDocument();
  });

  it('email yang sudah dipakai: galat dari server tampil di kolom email', async () => {
    mockSession(adminUser);
    server.use(
      http.post('/api/admin/users', () =>
        HttpResponse.json(
          { message: 'Data tidak valid.', errors: { email: ['Email ini sudah terdaftar.'] } },
          { status: 422 },
        ),
      ),
    );
    const user = setup('/admin/pengguna/baru');

    await user.type(await screen.findByLabelText(/^Nama lengkap/), 'Budi Santoso');
    await user.type(screen.getByLabelText(/^Email/), 'siti@pemdi.test');
    await user.type(password(), 'KataSandiSementara2026');
    await user.click(screen.getByRole('button', { name: 'Buat akun' }));

    expect(await screen.findByText('Email ini sudah terdaftar.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toHaveFocus();
  });
});

describe('ubah pengguna', () => {
  it('menyimpan perubahan nama, peran, dan status', async () => {
    mockSession(adminUser);
    const puts: unknown[] = [];
    server.use(
      http.get('/api/admin/users/2', () =>
        HttpResponse.json({ data: managedUser({ articles_count: 4 }) }),
      ),
      http.put('/api/admin/users/2', async ({ request }) => {
        puts.push(await request.json());
        return HttpResponse.json({ data: managedUser({ is_active: false, articles_count: 4 }) });
      }),
    );
    const user = setup('/admin/pengguna/2');

    await user.selectOptions(await screen.findByLabelText('Status akun'), 'Nonaktif');
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }));

    expect(await screen.findByText('Perubahan tersimpan')).toBeInTheDocument();
    expect(puts).toEqual([
      { name: 'Siti Penulis', email: 'siti@pemdi.test', role: 'penulis', is_active: false },
    ]);
    expect(screen.getByText('4')).toBeInTheDocument(); // artikel ditulis
  });

  it('akun sendiri: peran dan status terkunci, dan atur ulang kata sandi diarahkan ke Akun saya', async () => {
    mockSession(adminUser);
    server.use(
      http.get('/api/admin/users/1', () =>
        HttpResponse.json({
          data: managedUser({
            id: 1,
            name: 'Admin Utama',
            email: 'admin@pemdi.test',
            role: 'admin',
            role_label: 'Admin',
          }),
        }),
      ),
    );
    setup('/admin/pengguna/1');

    expect(await screen.findByLabelText('Peran')).toBeDisabled();
    expect(screen.getByLabelText('Status akun')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Atur ulang kata sandi' })).toBeDisabled();
    const aside = screen.getByRole('complementary', { name: 'Informasi akun' });
    expect(within(aside).getByRole('link', { name: 'Akun saya' })).toHaveAttribute(
      'href',
      '/admin/akun',
    );
  });

  it('pengaman admin terakhir: pesan dari server (409) tampil di atas formulir', async () => {
    mockSession(adminUser);
    server.use(
      http.get('/api/admin/users/5', () =>
        HttpResponse.json({
          data: managedUser({ id: 5, name: 'Admin Kedua', role: 'admin', role_label: 'Admin' }),
        }),
      ),
      http.put('/api/admin/users/5', () =>
        HttpResponse.json({ message: 'Minimal satu Admin aktif harus tersisa.' }, { status: 409 }),
      ),
    );
    const user = setup('/admin/pengguna/5');

    await user.selectOptions(await screen.findByLabelText('Status akun'), 'Nonaktif');
    await user.click(screen.getByRole('button', { name: 'Simpan perubahan' }));

    expect(await screen.findByText('Minimal satu Admin aktif harus tersisa.')).toBeInTheDocument();
  });

  it('atur ulang kata sandi: dialog berisi kata sandi acak, dikirim setelah konfirmasi', async () => {
    mockSession(adminUser);
    const posted: { password: string }[] = [];
    server.use(
      http.get('/api/admin/users/2', () => HttpResponse.json({ data: managedUser() })),
      http.post('/api/admin/users/2/password', async ({ request }) => {
        posted.push((await request.json()) as { password: string });
        return HttpResponse.json({ data: managedUser({ must_change_password: true }) });
      }),
    );
    const user = setup('/admin/pengguna/2');

    await user.click(await screen.findByRole('button', { name: 'Atur ulang kata sandi' }));
    const dialog = await screen.findByRole('dialog', { name: 'Atur ulang kata sandi?' });
    const field = within(dialog).getByLabelText<HTMLInputElement>(/^Kata sandi sementara baru/);
    await waitFor(() => expect(field).toHaveFocus());
    expect(validateNewPassword(field.value)).toBeNull();
    const generated = field.value;

    await user.click(within(dialog).getByRole('button', { name: 'Atur ulang' }));

    expect(await screen.findByText('Kata sandi diatur ulang')).toBeInTheDocument();
    expect(posted).toEqual([{ password: generated }]);
    expect(
      screen.getByText('Pengguna belum mengganti kata sandi sementaranya.'),
    ).toBeInTheDocument();
  });

  it('atur ulang dengan kata sandi lemah ditolak di dialog dan tidak dikirim', async () => {
    mockSession(adminUser);
    let called = false;
    server.use(
      http.get('/api/admin/users/2', () => HttpResponse.json({ data: managedUser() })),
      http.post('/api/admin/users/2/password', () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    const user = setup('/admin/pengguna/2');

    await user.click(await screen.findByRole('button', { name: 'Atur ulang kata sandi' }));
    const dialog = await screen.findByRole('dialog', { name: 'Atur ulang kata sandi?' });
    const field = within(dialog).getByLabelText(/^Kata sandi sementara baru/);
    await waitFor(() => expect(field).toHaveFocus());
    await user.clear(field);
    await user.type(field, 'lemah');
    await user.click(within(dialog).getByRole('button', { name: 'Atur ulang' }));

    expect(await within(dialog).findByText('Kata sandi minimal 12 karakter')).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('pengguna yang tidak ada: pemberitahuan dan tautan kembali', async () => {
    mockSession(adminUser);
    server.use(
      http.get('/api/admin/users/99', () =>
        HttpResponse.json({ message: 'Data tidak ditemukan.' }, { status: 404 }),
      ),
    );
    setup('/admin/pengguna/99');

    expect(await screen.findByText('Pengguna tidak ditemukan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kembali ke daftar pengguna' })).toHaveAttribute(
      'href',
      '/admin/pengguna',
    );
  });
});
