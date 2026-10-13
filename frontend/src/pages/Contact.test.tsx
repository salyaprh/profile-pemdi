import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../test/server';
import { renderPublic as renderWithToast } from '../test/utils';
import Contact from './Contact';

interface SentBody {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  token: string;
  kolom_khusus: string;
}

/** Backend kontak tiruan: mencatat isi setiap POST dan menjawab sesuai `respond`. */
function mockContactApi(
  respond: () => Response | Promise<Response> = () =>
    HttpResponse.json({ message: 'Pesan diterima.' }, { status: 202 }),
) {
  const sent: SentBody[] = [];
  const headers: Headers[] = [];
  server.use(
    http.post('/api/contact', async ({ request }) => {
      sent.push((await request.json()) as SentBody);
      headers.push(request.headers);
      return respond();
    }),
  );
  return { sent, headers };
}

const field = (label: RegExp | string) => screen.getByLabelText(label);
const submit = () => screen.getByRole('button', { name: /Kirim pesan|Mengirim/ });

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field(/Nama lengkap/), 'Budi Santoso');
  await user.type(field(/^Email/), 'budi@instansi.go.id');
  await user.type(field(/Subjek/), 'Kolaborasi program');
  await user.type(field(/^Pesan/), 'Halo, kami ingin berdiskusi terkait kolaborasi program.');
}

describe('Contact (Hubungi kami)', () => {
  it('menampilkan form kontak tanpa nilai awal contoh dan tanpa kolom password', () => {
    renderWithToast(<Contact />);

    expect(screen.getByRole('heading', { level: 1, name: 'Hubungi kami' })).toBeInTheDocument();
    for (const label of [/Nama lengkap/, /^Email/, /Subjek/, /^Pesan/]) {
      expect(field(label)).toHaveValue('');
    }
    expect(screen.queryByLabelText(/kata sandi|password/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Google/i)).not.toBeInTheDocument();
  });

  it('semua field punya label dan atribut autocomplete yang tepat', () => {
    renderWithToast(<Contact />);
    expect(field(/Nama lengkap/)).toHaveAttribute('autocomplete', 'name');
    expect(field(/^Email/)).toHaveAttribute('autocomplete', 'email');
    expect(field(/^Email/)).toHaveAttribute('type', 'email');
  });

  it('mengatur judul dan deskripsi dokumen', () => {
    renderWithToast(<Contact />);
    expect(document.title).toBe('Hubungi kami | PEMDI PANRB');
  });

  describe('validasi', () => {
    it('submit kosong menampilkan pesan error tiap field wajib, tidak mengirim, dan memfokuskan field pertama', async () => {
      const user = userEvent.setup();
      renderWithToast(<Contact />);

      await user.click(submit());

      expect(await screen.findByText('Nama lengkap wajib diisi')).toBeInTheDocument();
      expect(screen.getByText('Email wajib diisi')).toBeInTheDocument();
      expect(screen.getByText('Subjek wajib diisi')).toBeInTheDocument();
      expect(screen.getByText('Pesan wajib diisi')).toBeInTheDocument();
      expect(field(/Nama lengkap/)).toHaveFocus();
    });

    it('nomor ponsel bersifat opsional (tidak ada error saat kosong)', async () => {
      const user = userEvent.setup();
      renderWithToast(<Contact />);

      await user.click(submit());
      await screen.findByText('Nama lengkap wajib diisi');

      expect(screen.queryByText(/Nomor ponsel harus/)).not.toBeInTheDocument();
    });

    it('memfokuskan field pertama yang salah, bukan selalu field nama', async () => {
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await user.type(field(/Nama lengkap/), 'Budi Santoso');

      await user.click(submit());

      await screen.findByText('Email wajib diisi');
      expect(field(/^Email/)).toHaveFocus();
    });

    it('validasi berjalan langsung setelah submit pertama: error hilang saat diperbaiki', async () => {
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await user.click(submit());
      await screen.findByText('Email wajib diisi');

      await user.type(field(/^Email/), 'budi@instansi');
      expect(await screen.findByText('Format email tidak valid')).toBeInTheDocument();

      await user.type(field(/^Email/), '.go.id');
      await waitFor(() => expect(screen.queryByText('Format email tidak valid')).toBeNull());
    });

    it('tidak menampilkan error sebelum percobaan kirim pertama', async () => {
      const user = userEvent.setup();
      renderWithToast(<Contact />);

      await user.type(field(/^Email/), 'salah');

      expect(screen.queryByText('Format email tidak valid')).not.toBeInTheDocument();
    });

    it('menolak pesan terlalu pendek', async () => {
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await user.type(field(/^Pesan/), 'pendek');

      await user.click(submit());

      expect(await screen.findByText('Pesan minimal 10 karakter')).toBeInTheDocument();
    });

    it('menampilkan penghitung karakter pesan', async () => {
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      expect(screen.getByText('0/1000')).toBeInTheDocument();

      await user.type(field(/^Pesan/), 'abcde');
      expect(screen.getByText('5/1000')).toBeInTheDocument();
    });
  });

  describe('pengiriman', () => {
    it('berhasil: mengirim payload beserta token formulir, toast sukses, dan mengosongkan form', async () => {
      const { sent } = mockContactApi();
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);

      await user.click(submit());

      expect(await screen.findByText('Pesan terkirim')).toBeInTheDocument();
      expect(sent).toEqual([
        {
          name: 'Budi Santoso',
          email: 'budi@instansi.go.id',
          phone: '',
          subject: 'Kolaborasi program',
          message: 'Halo, kami ingin berdiskusi terkait kolaborasi program.',
          token: 'token-formulir-uji',
          kolom_khusus: '',
        },
      ]);
      for (const label of [/Nama lengkap/, /^Email/, /Subjek/, /^Pesan/]) {
        expect(field(label)).toHaveValue('');
      }
      expect(screen.queryByText('Nama lengkap wajib diisi')).not.toBeInTheDocument();
    });

    it('tanpa sesi: tidak meminta cookie CSRF dan tidak mengirim header X-XSRF-TOKEN', async () => {
      const csrfRequests: string[] = [];
      server.use(
        http.get('/api/csrf', ({ request }) => {
          csrfRequests.push(request.url);
          return new HttpResponse(null, { status: 204 });
        }),
      );
      const { headers } = mockContactApi();
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);

      await user.click(submit());

      await screen.findByText('Pesan terkirim');
      expect(csrfRequests).toEqual([]);
      expect(headers[0].get('X-XSRF-TOKEN')).toBeNull();
    });

    it('kolom jebakan bot tersembunyi dari pengguna, keyboard, dan pembaca layar', () => {
      const { container } = renderWithToast(<Contact />);
      const honeypot = container.querySelector('input[name="kolom_khusus"]');
      expect(honeypot).toHaveAttribute('tabindex', '-1');
      expect(honeypot).toHaveAttribute('autocomplete', 'off');
      expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(screen.queryByRole('textbox', { name: /Jangan isi/ })).not.toBeInTheDocument();
    });

    it('mengirim nomor ponsel dalam format internasional bila diisi', async () => {
      const { sent } = mockContactApi();
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);
      await user.type(screen.getByPlaceholderText('878-8668-3355'), '81234567890');

      await user.click(submit());

      await waitFor(() => expect(sent).toHaveLength(1));
      expect(sent[0].phone).toMatch(/^\+62\d{9,13}$/);
    });

    it('nomor yang diketik lalu dihapus (PhoneInput kembali ke "+62") dikirim sebagai string kosong', async () => {
      const { sent } = mockContactApi();
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);
      const phone = screen.getByPlaceholderText('878-8668-3355');

      await user.type(phone, '81'); // PhoneInput melaporkan "+6281"
      await user.type(phone, '{Backspace}{Backspace}'); // kembali ke "+62" (hanya kode negara)
      await user.click(submit());

      await waitFor(() => expect(sent).toHaveLength(1));
      expect(sent[0].phone).toBe('');
      expect(screen.queryByText(/Nomor ponsel harus/)).not.toBeInTheDocument();
    });

    it('nomor ponsel yang terlalu pendek ditolak dan tidak dikirim', async () => {
      const { sent } = mockContactApi();
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);
      await user.type(screen.getByPlaceholderText('878-8668-3355'), '81');

      await user.click(submit());

      expect(await screen.findByText('Nomor ponsel harus 10-15 digit angka')).toBeInTheDocument();
      expect(sent).toEqual([]);
    });

    it('galat validasi dari server tampil di kolomnya dan kolom itu difokuskan', async () => {
      mockContactApi(() =>
        HttpResponse.json(
          { message: 'Data tidak valid.', errors: { subject: ['Subjek maksimal 150 karakter'] } },
          { status: 422 },
        ),
      );
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);

      await user.click(submit());

      expect(await screen.findByText('Subjek maksimal 150 karakter')).toBeInTheDocument();
      expect(field(/Subjek/)).toHaveFocus();
      expect(screen.queryByText('Pesan terkirim')).not.toBeInTheDocument();
    });

    it('token formulir kedaluwarsa: toast dengan pesan server dan token baru diambil', async () => {
      let tokenRequests = 0;
      server.use(
        http.get('/api/contact/token', () => {
          tokenRequests += 1;
          return HttpResponse.json({ token: `token-${tokenRequests}` });
        }),
      );
      const { sent } = mockContactApi(() =>
        HttpResponse.json(
          {
            message: 'Formulir kedaluwarsa.',
            errors: { token: ['Formulir kedaluwarsa. Kirim ulang pesan Anda.'] },
          },
          { status: 422 },
        ),
      );
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);

      await user.click(submit());

      expect(await screen.findByText('Formulir perlu dimuat ulang')).toBeInTheDocument();
      expect(screen.getByText('Formulir kedaluwarsa. Kirim ulang pesan Anda.')).toBeInTheDocument();
      expect(sent[0].token).toBe('token-1');
      await waitFor(() => expect(tokenRequests).toBe(2));
      expect(field(/Nama lengkap/)).toHaveValue('Budi Santoso');
    });

    it('terlalu sering (429): pesan yang menjelaskan batasnya', async () => {
      mockContactApi(() => HttpResponse.json({ message: 'Too Many Attempts.' }, { status: 429 }));
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);

      await user.click(submit());

      expect(
        await screen.findByText(/Terlalu banyak pesan dari jaringan Anda/),
      ).toBeInTheDocument();
    });

    it('gagal: menampilkan toast error, mempertahankan isian, dan mengaktifkan tombol kembali', async () => {
      mockContactApi(() => HttpResponse.json({}, { status: 500 }));
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);

      await user.click(submit());

      expect(await screen.findByText('Pesan gagal dikirim')).toBeInTheDocument();
      expect(field(/Nama lengkap/)).toHaveValue('Budi Santoso');
      expect(screen.getByRole('button', { name: 'Kirim pesan' })).toBeEnabled();
    });

    it('menonaktifkan tombol dan menampilkan "Mengirim…" selama pengiriman (cegah kirim ganda)', async () => {
      const { sent } = mockContactApi(async () => {
        await delay(100);
        return HttpResponse.json({ message: 'Pesan diterima.' }, { status: 202 });
      });
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);

      await user.click(submit());

      const pending = await screen.findByRole('button', { name: 'Mengirim…' });
      expect(pending).toBeDisabled();
      await user.click(pending);

      expect(await screen.findByRole('button', { name: 'Kirim pesan' })).toBeEnabled();
      expect(sent).toHaveLength(1);
    });
  });
});
