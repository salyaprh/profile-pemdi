import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { sendContactMessage } from '../services/contact';
import { renderWithToast } from '../test/utils';
import Contact from './Contact';

vi.mock('../services/contact', () => ({ sendContactMessage: vi.fn() }));
const send = vi.mocked(sendContactMessage);

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
      expect(send).not.toHaveBeenCalled();
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
    it('berhasil: mengirim payload, menampilkan toast sukses, dan mengosongkan form', async () => {
      send.mockResolvedValue('sent');
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);

      await user.click(submit());

      expect(await screen.findByText('Pesan terkirim')).toBeInTheDocument();
      expect(send).toHaveBeenCalledOnce();
      expect(send).toHaveBeenCalledWith({
        name: 'Budi Santoso',
        email: 'budi@instansi.go.id',
        phone: '',
        subject: 'Kolaborasi program',
        message: 'Halo, kami ingin berdiskusi terkait kolaborasi program.',
      });
      for (const label of [/Nama lengkap/, /^Email/, /Subjek/, /^Pesan/]) {
        expect(field(label)).toHaveValue('');
      }
      expect(screen.queryByText('Nama lengkap wajib diisi')).not.toBeInTheDocument();
    });

    it('mengirim nomor ponsel dalam format internasional bila diisi', async () => {
      send.mockResolvedValue('sent');
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);
      await user.type(screen.getByPlaceholderText('878-8668-3355'), '81234567890');

      await user.click(submit());

      await waitFor(() => expect(send).toHaveBeenCalledOnce());
      const [payload] = send.mock.calls[0];
      expect(payload.phone).toMatch(/^\+62\d{9,13}$/);
    });

    it('nomor yang diketik lalu dihapus (PhoneInput kembali ke "+62") dikirim sebagai string kosong', async () => {
      send.mockResolvedValue('sent');
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);
      const phone = screen.getByPlaceholderText('878-8668-3355');

      await user.type(phone, '81'); // PhoneInput melaporkan "+6281"
      await user.type(phone, '{Backspace}{Backspace}'); // kembali ke "+62" (hanya kode negara)
      await user.click(submit());

      await waitFor(() => expect(send).toHaveBeenCalledOnce());
      expect(send.mock.calls[0][0].phone).toBe('');
      expect(screen.queryByText(/Nomor ponsel harus/)).not.toBeInTheDocument();
    });

    it('nomor ponsel yang terlalu pendek ditolak dan tidak dikirim', async () => {
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);
      await user.type(screen.getByPlaceholderText('878-8668-3355'), '81');

      await user.click(submit());

      expect(await screen.findByText('Nomor ponsel harus 10-15 digit angka')).toBeInTheDocument();
      expect(send).not.toHaveBeenCalled();
    });

    it('endpoint belum diset: memberi tahu pesan belum dikirim dan mempertahankan isian', async () => {
      send.mockResolvedValue('not-configured');
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);

      await user.click(submit());

      expect(await screen.findByText('Formulir belum terhubung ke server')).toBeInTheDocument();
      expect(screen.queryByText('Pesan terkirim')).not.toBeInTheDocument();
      expect(field(/Nama lengkap/)).toHaveValue('Budi Santoso');
    });

    it('gagal: menampilkan toast error, mempertahankan isian, dan mengaktifkan tombol kembali', async () => {
      send.mockRejectedValue(new Error('HTTP 500'));
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);

      await user.click(submit());

      expect(await screen.findByText('Pesan gagal dikirim')).toBeInTheDocument();
      expect(field(/Nama lengkap/)).toHaveValue('Budi Santoso');
      expect(screen.getByRole('button', { name: 'Kirim pesan' })).toBeEnabled();
    });

    it('menonaktifkan tombol dan menampilkan "Mengirim…" selama pengiriman (cegah kirim ganda)', async () => {
      let finish: (value: 'sent') => void = () => undefined;
      send.mockReturnValue(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
      const user = userEvent.setup();
      renderWithToast(<Contact />);
      await fillValid(user);

      await user.click(submit());

      const pending = await screen.findByRole('button', { name: 'Mengirim…' });
      expect(pending).toBeDisabled();
      await user.click(pending);
      expect(send).toHaveBeenCalledOnce();

      finish('sent');
      expect(await screen.findByRole('button', { name: 'Kirim pesan' })).toBeEnabled();
    });
  });
});
