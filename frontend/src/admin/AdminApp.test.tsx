import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server, setXsrfCookie } from '../test/server';
import { renderWithToast, setUrl } from '../test/utils';
import AdminApp from './AdminApp';
import type { AdminUser } from './auth';
import type { DashboardData } from './pages/DashboardPage';
import { createAdminQueryClient } from './queryClient';

const admin: AdminUser = {
  id: 1,
  name: 'Admin Utama',
  email: 'admin@pemdi.test',
  role: 'admin',
  role_label: 'Admin',
};

const penulis: AdminUser = {
  id: 2,
  name: 'Siti Penulis',
  email: 'siti@pemdi.test',
  role: 'penulis',
  role_label: 'Penulis',
};

const dashboard: DashboardData = {
  metrics: { published: 36, in_review: 2, draft: 5 },
  recent_activity: [
    {
      id: 9,
      action: 'login',
      description: 'Masuk ke CMS.',
      user_name: 'Admin Utama',
      created_at: '2026-10-13T07:05:00+00:00',
    },
  ],
};

/** Backend tiruan dengan sesi: login/logout benar-benar mengubah hasil /api/auth/me. */
function mockBackend(initialUser: AdminUser | null, password = 'KataSandiBenar123') {
  let current = initialUser;
  const loginRequests: unknown[] = [];

  server.use(
    http.get('/api/csrf', () => {
      setXsrfCookie('token-uji');
      return new HttpResponse(null, { status: 204 });
    }),
    http.get('/api/auth/me', () => HttpResponse.json({ user: current })),
    http.post('/api/auth/login', async ({ request }) => {
      const body = (await request.json()) as { email: string; password: string };
      loginRequests.push(body);
      if (body.password !== password) {
        return HttpResponse.json(
          {
            message: 'Email atau kata sandi salah.',
            errors: { email: ['Email atau kata sandi salah.'] },
          },
          { status: 422 },
        );
      }
      current = body.email === penulis.email ? penulis : admin;
      return HttpResponse.json({ user: current });
    }),
    http.post('/api/auth/logout', () => {
      current = null;
      return new HttpResponse(null, { status: 204 });
    }),
    http.get('/api/admin/dashboard', () =>
      current
        ? HttpResponse.json(
            current.role === 'admin' ? dashboard : { ...dashboard, recent_activity: [] },
          )
        : HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 }),
    ),
  );

  return { loginRequests };
}

/** Merender panel admin di URL tertentu dan mengembalikan userEvent. */
function setupAdmin(url: string) {
  setUrl(url);
  const queryClient = createAdminQueryClient({ queries: { retry: false } });
  const user = userEvent.setup();
  renderWithToast(<AdminApp queryClient={queryClient} />);
  return user;
}

const currentUrl = () => window.location.pathname + window.location.search;

describe('panel admin: login', () => {
  it('tamu yang membuka /admin diarahkan ke halaman Masuk dengan tujuan kembali', async () => {
    mockBackend(null);
    setupAdmin('/admin');

    expect(await screen.findByRole('heading', { name: 'Masuk ke CMS' })).toBeInTheDocument();
    expect(currentUrl()).toBe('/admin/masuk?kembali=%2Fadmin');
    expect(document.title).toBe('Masuk ke CMS | PEMDI PANRB');
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex',
    );
  });

  it('memvalidasi kolom di browser tanpa mengirim permintaan', async () => {
    const { loginRequests } = mockBackend(null);
    const user = setupAdmin('/admin/masuk');

    await user.click(await screen.findByRole('button', { name: 'Masuk' }));

    expect(screen.getByText('Email wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi wajib diisi')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toHaveFocus();
    expect(screen.getByLabelText(/^Email/)).toHaveAttribute('aria-invalid', 'true');

    await user.type(screen.getByLabelText(/^Email/), 'bukan-email');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(screen.getByText('Format email tidak valid')).toBeInTheDocument();
    expect(loginRequests).toEqual([]);
  });

  it('kredensial salah: pesan dari server tampil sebagai peringatan, tetap di halaman Masuk', async () => {
    mockBackend(null);
    const user = setupAdmin('/admin/masuk');

    await user.type(await screen.findByLabelText(/^Email/), 'admin@pemdi.test');
    await user.type(screen.getByLabelText(/^Kata sandi/), 'salah');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email atau kata sandi salah.');
    expect(currentUrl()).toBe('/admin/masuk');
  });

  it('berhasil masuk lalu kembali ke halaman yang tadi dibuka', async () => {
    const { loginRequests } = mockBackend(null);
    const user = setupAdmin('/admin');

    await user.type(await screen.findByLabelText(/^Email/), '  admin@pemdi.test ');
    await user.type(screen.getByLabelText(/^Kata sandi/), 'KataSandiBenar123');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));

    expect(await screen.findByRole('heading', { name: 'Dasbor' })).toBeInTheDocument();
    expect(currentUrl()).toBe('/admin');
    expect(loginRequests).toEqual([{ email: 'admin@pemdi.test', password: 'KataSandiBenar123' }]);
  });

  it('pengguna yang sudah login dan membuka halaman Masuk langsung diteruskan', async () => {
    mockBackend(admin);
    setupAdmin('/admin/masuk?kembali=%2Fadmin');

    expect(await screen.findByRole('heading', { name: 'Dasbor' })).toBeInTheDocument();
    expect(currentUrl()).toBe('/admin');
  });

  it('tujuan kembali ke luar panel admin diabaikan', async () => {
    mockBackend(admin);
    setupAdmin('/admin/masuk?kembali=https%3A%2F%2Fsitus-jahat.example');

    expect(await screen.findByRole('heading', { name: 'Dasbor' })).toBeInTheDocument();
    expect(currentUrl()).toBe('/admin');
  });

  it('server tidak dapat dihubungi: pesan jelas dan tombol coba lagi', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.error()));
    const user = setupAdmin('/admin');

    expect(await screen.findByText('Panel admin tidak dapat dimuat')).toBeInTheDocument();

    mockBackend(admin);
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(await screen.findByRole('heading', { name: 'Dasbor' })).toBeInTheDocument();
  });
});

describe('panel admin: dasbor dan layout', () => {
  it('Admin melihat metrik seluruh artikel dan aktivitas terbaru (WIB)', async () => {
    mockBackend(admin);
    setupAdmin('/admin');

    expect(await screen.findByText('36')).toBeInTheDocument();
    const metrics = screen.getByRole('region', { name: 'Ringkasan artikel' });
    expect(within(metrics).getByText('Menunggu tinjauan').closest('div')).toHaveTextContent('2');
    expect(within(metrics).getByText('Draf').closest('div')).toHaveTextContent('5');

    const activity = screen.getByRole('region', { name: 'Aktivitas terbaru' });
    expect(within(activity).getByText(/Masuk ke CMS/)).toBeInTheDocument();
    expect(within(activity).getByText('13 Okt 2026, 14.05 WIB')).toBeInTheDocument();

    expect(screen.getByText('Admin Utama', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Admin', { selector: '*:not(p)' })).toBeInTheDocument();
  });

  it('Penulis hanya melihat ringkasan artikelnya, tanpa log aktivitas', async () => {
    mockBackend(penulis);
    setupAdmin('/admin');

    expect(await screen.findByText(/Berikut ringkasan artikel Anda/)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Aktivitas terbaru' })).not.toBeInTheDocument();
  });

  it('menu aktif ditandai aria-current', async () => {
    mockBackend(admin);
    setupAdmin('/admin');

    const [sidebar] = await screen.findAllByRole('navigation', { name: 'Menu admin' });
    expect(within(sidebar).getByRole('link', { name: 'Dasbor' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('gagal memuat dasbor: pesan dan tombol coba lagi', async () => {
    mockBackend(admin);
    server.use(
      http.get('/api/admin/dashboard', () =>
        HttpResponse.json({ message: 'Server Error' }, { status: 500 }),
      ),
    );
    const user = setupAdmin('/admin');

    expect(await screen.findByText('Ringkasan gagal dimuat')).toBeInTheDocument();
    expect(
      screen.getByText('Terjadi kesalahan di server. Coba lagi beberapa saat lagi.'),
    ).toBeInTheDocument();

    mockBackend(admin);
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(await screen.findByText('36')).toBeInTheDocument();
  });

  it('sesi berakhir di server (401) mengarahkan kembali ke halaman Masuk', async () => {
    mockBackend(admin);
    server.use(
      http.get('/api/admin/dashboard', () =>
        HttpResponse.json({ message: 'Akun Anda dinonaktifkan. Hubungi Admin.' }, { status: 401 }),
      ),
    );
    setupAdmin('/admin');

    expect(await screen.findByRole('heading', { name: 'Masuk ke CMS' })).toBeInTheDocument();
    expect(currentUrl()).toBe('/admin/masuk?kembali=%2Fadmin');
  });

  it('keluar mengakhiri sesi dan kembali ke halaman Masuk', async () => {
    mockBackend(admin);
    const user = setupAdmin('/admin');

    await user.click(await screen.findByRole('button', { name: 'Keluar' }));

    expect(await screen.findByRole('heading', { name: 'Masuk ke CMS' })).toBeInTheDocument();
    expect(currentUrl()).toBe('/admin/masuk');
    expect(await screen.findByText('Anda telah keluar')).toBeInTheDocument();
  });

  it('halaman admin yang tidak ada tampil di dalam layout', async () => {
    mockBackend(admin);
    setupAdmin('/admin/tidak-ada');

    expect(await screen.findByText('Halaman admin tidak ditemukan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kembali ke dasbor' })).toHaveAttribute(
      'href',
      '/admin',
    );
  });

  it('menu mobile dibuka dan ditutup dengan tombol atau Escape', async () => {
    mockBackend(admin);
    const user = setupAdmin('/admin');

    const toggle = await screen.findByRole('button', { name: 'Buka menu admin' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAccessibleName('Tutup menu admin');
    expect(document.getElementById('menu-admin-mobile')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('menu-admin-mobile')).not.toBeInTheDocument();
  });

  it('sidebar yang diciutkan diingat di browser', async () => {
    mockBackend(admin);
    const user = setupAdmin('/admin');

    await user.click(await screen.findByRole('button', { name: 'Ciutkan menu' }));

    expect(screen.getByRole('button', { name: 'Lebarkan menu' })).toBeInTheDocument();
    expect(window.localStorage.getItem('pemdi-admin-sidebar-diciutkan')).toBe('1');
    await waitFor(() => expect(currentUrl()).toBe('/admin'));
  });
});
