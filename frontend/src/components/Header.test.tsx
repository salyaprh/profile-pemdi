import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { navigationItems } from '../data/siteContent';
import { testCategories } from '../test/publicApi';
import { server } from '../test/server';
import { renderPublic as render, setUrl } from '../test/utils';
import Header from './Header';

const mainNav = () => screen.getByRole('navigation', { name: 'Navigasi utama' });
/** Teks menu utama (tautan atau tombol dropdown) yang ditandai aria-current. */
const currentItems = () =>
  [...within(mainNav()).queryAllByRole('link'), ...within(mainNav()).queryAllByRole('button')]
    .filter((item) => item.hasAttribute('aria-current'))
    .map((item) => item.textContent);

describe('Header', () => {
  it('menampilkan logo yang menaut ke beranda dengan nama aksesibel', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'PEMDI PANRB, ke beranda' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('menampilkan 3 menu utama sesuai pedoman IDDS (3-5 item), Portofolio sebagai dropdown', () => {
    render(<Header />);
    const links = within(mainNav()).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Beranda', 'Hubungi kami']);
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/', '/contact']);
    expect(within(mainNav()).getByRole('button', { name: 'Portofolio' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(navigationItems.length).toBeGreaterThanOrEqual(3);
    expect(navigationItems.length).toBeLessThanOrEqual(5);
  });

  it.each([
    ['/', 'Beranda'],
    ['/portfolio', 'Portofolio'],
    ['/portfolio?kategori=Layanan+Publik', 'Portofolio'],
    ['/portfolio/3', 'Portofolio'],
    ['/contact', 'Hubungi kami'],
  ])('menandai menu aktif dengan aria-current untuk %s -> %s', (url, active) => {
    setUrl(url);
    render(<Header />);

    expect(currentItems()).toEqual([active]);
  });

  it('tidak menandai menu apa pun aktif pada halaman 404', () => {
    setUrl('/halaman-ngawur');
    render(<Header />);
    expect(currentItems()).toEqual([]);
  });

  it('klik menu berpindah halaman dan memperbarui menu aktif', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(within(mainNav()).getByRole('link', { name: 'Hubungi kami' }));

    expect(window.location.pathname).toBe('/contact');
    expect(within(mainNav()).getByRole('link', { name: 'Hubungi kami' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(mainNav()).getByRole('link', { name: 'Beranda' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  describe('dropdown Portofolio', () => {
    const toggle = () => within(mainNav()).getByRole('button', { name: 'Portofolio' });

    it('dibuka dengan klik dan berisi semua portofolio + kategori dari CMS', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await user.click(toggle());
      expect(toggle()).toHaveAttribute('aria-expanded', 'true');
      const panel = document.getElementById(toggle().getAttribute('aria-controls') ?? '');
      expect(panel).not.toBeNull();
      expect(within(panel!).getByRole('link', { name: 'Semua portofolio' })).toHaveAttribute(
        'href',
        '/portfolio',
      );
      for (const category of testCategories) {
        expect(await within(panel!).findByRole('link', { name: category.name })).toHaveAttribute(
          'href',
          `/portfolio?kategori=${category.slug}`,
        );
      }
    });

    it('memilih kategori berpindah ke portofolio terfilter dan menutup dropdown', async () => {
      const [category] = testCategories;
      const user = userEvent.setup();
      render(<Header />);

      // Dibuka lewat keyboard: user-event memicu pointerleave saat kursor pindah ke dalam panel
      // (tidak terjadi di browser), jadi hover diuji terpisah dan klik di panel diuji di e2e.
      toggle().focus();
      await user.keyboard('{Enter}');
      await user.click(await within(mainNav()).findByRole('link', { name: category.name }));

      expect(window.location.pathname + window.location.search).toBe(
        `/portfolio?kategori=${category.slug}`,
      );
      expect(toggle()).toHaveAttribute('aria-expanded', 'false');
      expect(toggle()).toHaveAttribute('aria-current', 'true');
    });

    it('menandai kategori yang sedang dibuka dengan aria-current', async () => {
      const [, category] = testCategories;
      setUrl(`/portfolio?kategori=${category.slug}`);
      const user = userEvent.setup();
      render(<Header />);

      await user.click(toggle());
      expect(await within(mainNav()).findByRole('link', { name: category.name })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(within(mainNav()).getByRole('link', { name: 'Semua portofolio' })).not.toHaveAttribute(
        'aria-current',
      );
    });

    it('ditutup dengan Escape dan fokus kembali ke tombol', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await user.click(toggle());
      await user.tab();
      expect(within(mainNav()).getByRole('link', { name: 'Semua portofolio' })).toHaveFocus();
      await user.keyboard('{Escape}');

      expect(toggle()).toHaveAttribute('aria-expanded', 'false');
      expect(toggle()).toHaveFocus();
    });

    it('ditutup saat klik di luar atau fokus berpindah keluar', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await user.click(toggle());
      await user.click(document.body);
      expect(toggle()).toHaveAttribute('aria-expanded', 'false');

      await user.click(toggle());
      await user.click(screen.getByRole('textbox', { name: 'Cari artikel portofolio' }));
      expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    });

    it('dibuka saat mouse diarahkan, dan klik setelahnya tidak langsung menutup', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await user.hover(toggle());
      expect(toggle()).toHaveAttribute('aria-expanded', 'true');
      await user.click(toggle());
      expect(toggle()).toHaveAttribute('aria-expanded', 'true');

      await user.unhover(toggle());
      expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    });

    it('bila kategori gagal dimuat, tetap berisi tautan ke semua portofolio', async () => {
      let failed = false;
      server.use(
        http.get('/api/categories', () => {
          failed = true;
          return HttpResponse.json({}, { status: 500 });
        }),
      );
      const user = userEvent.setup();
      render(<Header />);

      await user.click(toggle());
      await waitFor(() => expect(failed).toBe(true));
      const links = within(mainNav()).getAllByRole('link');
      expect(links.map((l) => l.textContent)).toEqual([
        'Beranda',
        'Semua portofolio',
        'Hubungi kami',
      ]);
    });
  });

  it('menyertakan kolom pencarian', () => {
    render(<Header />);
    expect(screen.getByRole('textbox', { name: 'Cari artikel portofolio' })).toBeInTheDocument();
  });

  describe('menu mobile', () => {
    it('tertutup secara default dan tombolnya menyatakan aria-expanded=false', () => {
      render(<Header />);
      const toggle = screen.getByRole('button', { name: 'Buka menu' });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(toggle).toHaveAttribute('aria-controls', 'menu-mobile');
      expect(document.getElementById('menu-mobile')).toBeNull();
    });

    it('dibuka dan ditutup lewat tombol, dengan label dan aria-expanded yang ikut berubah', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByRole('button', { name: 'Buka menu' }));
      const toggle = screen.getByRole('button', { name: 'Tutup menu' });
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(document.getElementById('menu-mobile')).not.toBeNull();

      await user.click(toggle);
      expect(document.getElementById('menu-mobile')).toBeNull();
    });

    it('ditutup dengan tombol Escape', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByRole('button', { name: 'Buka menu' }));
      await user.keyboard('{Escape}');

      expect(document.getElementById('menu-mobile')).toBeNull();
    });

    it('Escape di kolom cari menutup panel hasil dulu; Escape kedua baru menutup menu', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByRole('button', { name: 'Buka menu' }));
      const mobileMenu = document.getElementById('menu-mobile') as HTMLElement;
      const input = within(mobileMenu).getByRole('textbox', { name: 'Cari artikel portofolio' });
      await user.type(input, 'zzzxxx');
      expect(await within(mobileMenu).findByText(/Tidak ada hasil untuk/)).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(within(mobileMenu).queryByText(/Tidak ada hasil untuk/)).not.toBeInTheDocument();
      expect(document.getElementById('menu-mobile')).not.toBeNull();
      expect(input).toHaveValue('zzzxxx');

      await user.keyboard('{Escape}');
      expect(document.getElementById('menu-mobile')).toBeNull();
    });

    it('ditutup otomatis setelah memilih menu, dan berpindah halaman', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByRole('button', { name: 'Buka menu' }));
      const mobileNav = screen.getByRole('navigation', { name: 'Navigasi mobile' });
      await user.click(within(mobileNav).getByRole('button', { name: 'Portofolio' }));
      await user.click(within(mobileNav).getByRole('link', { name: 'Semua portofolio' }));

      expect(window.location.pathname).toBe('/portfolio');
      expect(document.getElementById('menu-mobile')).toBeNull();
    });

    it('submenu Portofolio dibuka lewat tombolnya dan berisi kategori', async () => {
      const [category] = testCategories;
      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByRole('button', { name: 'Buka menu' }));
      const mobileNav = screen.getByRole('navigation', { name: 'Navigasi mobile' });
      const subToggle = within(mobileNav).getByRole('button', { name: 'Portofolio' });
      expect(subToggle).toHaveAttribute('aria-expanded', 'false');

      await user.click(subToggle);
      expect(subToggle).toHaveAttribute('aria-expanded', 'true');
      await user.click(await within(mobileNav).findByRole('link', { name: category.name }));

      expect(window.location.search).toBe(`?kategori=${category.slug}`);
      expect(document.getElementById('menu-mobile')).toBeNull();
    });

    it('submenu Portofolio sudah terbuka saat berada di halaman portofolio', async () => {
      setUrl('/portfolio');
      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByRole('button', { name: 'Buka menu' }));
      const mobileNav = screen.getByRole('navigation', { name: 'Navigasi mobile' });
      expect(within(mobileNav).getByRole('button', { name: 'Portofolio' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      expect(within(mobileNav).getByRole('link', { name: 'Semua portofolio' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('menandai menu aktif juga di menu mobile', async () => {
      setUrl('/contact');
      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByRole('button', { name: 'Buka menu' }));
      const mobileNav = screen.getByRole('navigation', { name: 'Navigasi mobile' });
      expect(within(mobileNav).getByRole('link', { name: 'Hubungi kami' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  });
});
