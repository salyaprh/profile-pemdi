import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { paths } from '../lib/router';
import { testArticles } from '../test/publicApi';
import { server } from '../test/server';
import { renderPublic as render } from '../test/utils';
import SearchBar from './SearchBar';

const getInput = () => screen.getByRole('textbox', { name: 'Cari artikel portofolio' });

/** Artikel tiruan yang judul/ringkasannya memuat kata kunci (sama dengan pencarian server). */
const searchArticles = (term: string) =>
  testArticles.filter((a) => `${a.title} ${a.excerpt}`.toLowerCase().includes(term.toLowerCase()));

describe('SearchBar', () => {
  it('menyediakan kolom cari dengan placeholder kontekstual', () => {
    render(<SearchBar />);
    expect(getInput()).toHaveAttribute('placeholder', 'Cari artikel portofolio');
  });

  it('belum menampilkan hasil sebelum mengetik', () => {
    render(<SearchBar />);
    expect(screen.queryByText(/hasil pencarian/i)).not.toBeInTheDocument();
  });

  it('menampilkan jumlah dan daftar hasil (judul + kategori) dari API sesuai kueri', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const expected = searchArticles('panduan');
    expect(expected.length).toBeGreaterThan(1);

    await user.type(getInput(), 'panduan');

    expect(await screen.findByText(`${expected.length} hasil pencarian`)).toBeInTheDocument();
    for (const article of expected) {
      const link = screen.getByRole('link', { name: (name) => name.startsWith(article.title) });
      expect(link).toHaveAttribute('href', paths.article(article.slug));
    }
  });

  it('menunggu jeda mengetik: satu permintaan untuk kata kunci utuh', async () => {
    const searches: string[] = [];
    server.events.on('request:start', ({ request }) => {
      const cari = new URL(request.url).searchParams.get('cari');
      if (cari) searches.push(cari);
    });
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(getInput(), 'panduan');
    expect(screen.getByRole('status')).toHaveTextContent('Mencari…');
    await screen.findByText(/hasil pencarian/);

    expect(searches).toEqual(['panduan']);
  });

  it('pencarian gagal: pesan galat, bukan "tidak ada hasil"', async () => {
    server.use(http.get('/api/articles', () => HttpResponse.error()));
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(getInput(), 'panduan');

    expect(await screen.findByText(/Pencarian gagal/)).toBeInTheDocument();
    expect(screen.queryByText(/Tidak ada hasil/)).not.toBeInTheDocument();
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

    await user.type(getInput(), 'transparansi');
    await screen.findByText('1 hasil pencarian');
    await user.keyboard('{Enter}');

    expect(window.location.pathname).toBe(paths.article(first.slug));
    expect(getInput()).toHaveValue('');
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByText(/hasil pencarian/i)).not.toBeInTheDocument();
  });

  it('Enter tanpa hasil tidak berpindah halaman', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(getInput(), 'zzzxxx');
    await screen.findByText(/Tidak ada hasil untuk/);
    await user.keyboard('{Enter}');

    expect(window.location.pathname).toBe('/');
    expect(getInput()).toHaveValue('zzzxxx');
  });

  it('klik pada hasil membuka artikel dan membersihkan pencarian', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SearchBar onSelect={onSelect} />);
    const [, second] = searchArticles('panduan');

    await user.type(getInput(), 'panduan');
    await user.click(
      await screen.findByRole('link', { name: (name) => name.startsWith(second.title) }),
    );

    expect(window.location.pathname).toBe(paths.article(second.slug));
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
