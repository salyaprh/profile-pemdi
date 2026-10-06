import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { searchArticles } from '../data/articlesData';
import { paths } from '../lib/router';
import SearchBar from './SearchBar';

const getInput = () => screen.getByRole('textbox', { name: 'Cari artikel portofolio' });

describe('SearchBar', () => {
  it('menyediakan kolom cari dengan placeholder kontekstual', () => {
    render(<SearchBar />);
    expect(getInput()).toHaveAttribute('placeholder', 'Cari artikel portofolio');
  });

  it('belum menampilkan hasil sebelum mengetik', () => {
    render(<SearchBar />);
    expect(screen.queryByText(/hasil pencarian/i)).not.toBeInTheDocument();
  });

  it('menampilkan jumlah dan daftar hasil (judul + kategori) sesuai kueri', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const expected = searchArticles('transparansi');

    await user.type(getInput(), 'transparansi');

    expect(await screen.findByText(`${expected.length} hasil pencarian`)).toBeInTheDocument();
    for (const article of expected) {
      const link = screen.getByRole('link', { name: new RegExp(article.title.slice(0, 20)) });
      expect(link).toHaveAttribute('href', paths.article(article.id));
    }
  });

  it('menampilkan pesan (bukan daftar kosong) saat tidak ada hasil', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(getInput(), 'zzzxxx');

    expect(await screen.findByText(/Tidak ada hasil untuk/)).toHaveTextContent('zzzxxx');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('Enter membuka hasil pertama, mengosongkan kolom, dan menutup panel', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SearchBar onSelect={onSelect} />);
    const [first] = searchArticles('transparansi');

    await user.type(getInput(), 'transparansi{Enter}');

    expect(window.location.pathname).toBe(paths.article(first.id));
    expect(getInput()).toHaveValue('');
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByText(/hasil pencarian/i)).not.toBeInTheDocument();
  });

  it('Enter tanpa hasil tidak berpindah halaman', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(getInput(), 'zzzxxx{Enter}');

    expect(window.location.pathname).toBe('/');
    expect(getInput()).toHaveValue('zzzxxx');
  });

  it('klik pada hasil membuka artikel dan membersihkan pencarian', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SearchBar onSelect={onSelect} />);
    const [, second] = searchArticles('transparansi');

    await user.type(getInput(), 'transparansi');
    await user.click(
      await screen.findByRole('link', { name: new RegExp(second.title.slice(0, 20)) }),
    );

    expect(window.location.pathname).toBe(paths.article(second.id));
    expect(getInput()).toHaveValue('');
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('Escape saat panel terbuka tidak diteruskan ke atas (agar menu mobile tidak ikut tertutup)', async () => {
    const user = userEvent.setup();
    const onWindowKeyDown = vi.fn();
    window.addEventListener('keydown', onWindowKeyDown);
    render(<SearchBar />);

    await user.type(getInput(), 'zzzxxx');
    await screen.findByText(/Tidak ada hasil untuk/);
    await user.keyboard('{Escape}');

    expect(
      onWindowKeyDown.mock.calls.filter(([event]) => (event as KeyboardEvent).key === 'Escape'),
    ).toHaveLength(0);
    window.removeEventListener('keydown', onWindowKeyDown);
  });

  it('Escape saat panel tertutup diteruskan ke atas (agar Header dapat menutup menu)', async () => {
    const user = userEvent.setup();
    const onWindowKeyDown = vi.fn();
    window.addEventListener('keydown', onWindowKeyDown);
    render(<SearchBar />);

    await user.click(getInput());
    await user.keyboard('{Escape}');

    expect(
      onWindowKeyDown.mock.calls.filter(([event]) => (event as KeyboardEvent).key === 'Escape'),
    ).toHaveLength(1);
    window.removeEventListener('keydown', onWindowKeyDown);
  });

  it('Escape menutup panel tetapi mempertahankan teks', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(getInput(), 'zzzxxx');
    expect(await screen.findByText(/Tidak ada hasil untuk/)).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByText(/Tidak ada hasil untuk/)).not.toBeInTheDocument();
    expect(getInput()).toHaveValue('zzzxxx');
  });
});
