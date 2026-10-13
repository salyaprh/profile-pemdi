import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../test/server';
import { renderWithToast, setUrl } from '../../test/utils';
import AdminApp from '../AdminApp';
import { createAdminQueryClient } from '../queryClient';
import { adminUser, mockSession, penulisUser } from '../test-helpers';

function setup(url: string) {
  setUrl(url);
  const user = userEvent.setup();
  renderWithToast(<AdminApp queryClient={createAdminQueryClient({ queries: { retry: false } })} />);
  return user;
}

const current = () => screen.getByLabelText(/^Kata sandi saat ini/);
const next = () => screen.getByLabelText(/^Kata sandi baru/);
const repeat = () => screen.getByLabelText(/^Ulangi kata sandi baru/);

describe('akun saya: ganti kata sandi', () => {
  it('tersedia untuk Admin maupun Penulis', async () => {
    mockSession(penulisUser);
    setup('/admin/akun');

    expect(await screen.findByRole('heading', { level: 1, name: 'Akun saya' })).toBeInTheDocument();
    expect(screen.getByText(/Siti Penulis · siti@pemdi.test · Penulis/)).toBeInTheDocument();
  });

  it('validasi di browser: kosong, lemah, sama dengan yang lama, dan konfirmasi berbeda', async () => {
    mockSession(adminUser);
    const puts: unknown[] = [];
    server.use(
      http.put('/api/auth/password', async ({ request }) => {
        puts.push(await request.json());
        return HttpResponse.json({}, { status: 500 });
      }),
    );
    const user = setup('/admin/akun');

    await user.click(await screen.findByRole('button', { name: 'Ganti kata sandi' }));
    expect(screen.getByText('Kata sandi saat ini wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi wajib diisi')).toBeInTheDocument();
    expect(current()).toHaveFocus();

    await user.type(current(), 'KataSandiLama2026');
    await user.type(next(), 'KataSandiLama2026');
    await user.type(repeat(), 'Berbeda12345Baru');
    await user.click(screen.getByRole('button', { name: 'Ganti kata sandi' }));
    expect(
      await screen.findByText('Kata sandi baru harus berbeda dari yang sekarang'),
    ).toBeInTheDocument();
    expect(screen.getByText('Konfirmasi tidak sama dengan kata sandi baru')).toBeInTheDocument();
    expect(puts).toEqual([]);
  });

  it('berhasil: mengirim ketiga isian, menampilkan toast, dan mengosongkan formulir', async () => {
    mockSession(adminUser);
    const puts: unknown[] = [];
    server.use(
      http.put('/api/auth/password', async ({ request }) => {
        puts.push(await request.json());
        return HttpResponse.json({ user: adminUser });
      }),
    );
    const user = setup('/admin/akun');

    await user.type(await screen.findByLabelText(/^Kata sandi saat ini/), 'KataSandiLama2026');
    await user.type(next(), 'KataSandiBaru2026');
    await user.type(repeat(), 'KataSandiBaru2026');
    await user.click(screen.getByRole('button', { name: 'Ganti kata sandi' }));

    expect(await screen.findByText('Kata sandi diganti')).toBeInTheDocument();
    expect(puts).toEqual([
      {
        current_password: 'KataSandiLama2026',
        password: 'KataSandiBaru2026',
        password_confirmation: 'KataSandiBaru2026',
      },
    ]);
    expect(current()).toHaveValue('');
  });

  it('kata sandi saat ini salah: galat dari server tampil di kolomnya', async () => {
    mockSession(adminUser);
    server.use(
      http.put('/api/auth/password', () =>
        HttpResponse.json(
          {
            message: 'Data tidak valid.',
            errors: { current_password: ['Kata sandi saat ini salah.'] },
          },
          { status: 422 },
        ),
      ),
    );
    const user = setup('/admin/akun');

    await user.type(await screen.findByLabelText(/^Kata sandi saat ini/), 'SalahSalah12345');
    await user.type(next(), 'KataSandiBaru2026');
    await user.type(repeat(), 'KataSandiBaru2026');
    await user.click(screen.getByRole('button', { name: 'Ganti kata sandi' }));

    expect(await screen.findByText('Kata sandi saat ini salah.')).toBeInTheDocument();
    expect(current()).toHaveFocus();
  });
});

describe('kata sandi sementara (wajib ganti)', () => {
  const temporary = { ...penulisUser, must_change_password: true };

  it('halaman lain dialihkan ke Akun saya beserta penjelasannya', async () => {
    mockSession(temporary);
    setup('/admin/artikel');

    expect(await screen.findByText('Ganti kata sandi sementara Anda')).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe('/admin/akun'));
  });

  it('setelah diganti, penanda hilang dan panel bisa dipakai', async () => {
    mockSession(temporary);
    server.use(http.put('/api/auth/password', () => HttpResponse.json({ user: penulisUser })));
    const user = setup('/admin/akun');

    await user.type(await screen.findByLabelText(/^Kata sandi saat ini/), 'SementaraAdmin2026');
    await user.type(next(), 'KataSandiPribadi2026');
    await user.type(repeat(), 'KataSandiPribadi2026');
    await user.click(screen.getByRole('button', { name: 'Ganti kata sandi' }));

    await waitFor(() =>
      expect(screen.queryByText('Ganti kata sandi sementara Anda')).not.toBeInTheDocument(),
    );
  });
});
