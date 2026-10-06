import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { navigationItems } from '../data/siteContent';
import { setUrl } from '../test/utils';
import Header from './Header';

const mainNav = () => screen.getByRole('navigation', { name: 'Navigasi utama' });

describe('Header', () => {
  it('menampilkan logo yang menaut ke beranda dengan nama aksesibel', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'PEMDI PANRB, ke beranda' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('menampilkan 3 menu utama sesuai pedoman IDDS (3-5 item)', () => {
    render(<Header />);
    const links = within(mainNav()).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Beranda', 'Portofolio', 'Hubungi kami']);
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/', '/portfolio', '/contact']);
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

    const current = within(mainNav())
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current.map((l) => l.textContent)).toEqual([active]);
  });

  it('tidak menandai menu apa pun aktif pada halaman 404', () => {
    setUrl('/halaman-ngawur');
    render(<Header />);
    const current = within(mainNav())
      .getAllByRole('link')
      .filter((link) => link.hasAttribute('aria-current'));
    expect(current).toHaveLength(0);
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

    it('ditutup otomatis setelah memilih menu, dan berpindah halaman', async () => {
      const user = userEvent.setup();
      render(<Header />);

      await user.click(screen.getByRole('button', { name: 'Buka menu' }));
      const mobileNav = screen.getByRole('navigation', { name: 'Navigasi mobile' });
      await user.click(within(mobileNav).getByRole('link', { name: 'Portofolio' }));

      expect(window.location.pathname).toBe('/portfolio');
      expect(document.getElementById('menu-mobile')).toBeNull();
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
