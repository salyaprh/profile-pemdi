import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Link, navigate, paths, useLocation } from './router';

describe('paths', () => {
  it('membentuk path rute', () => {
    expect(paths.home).toBe('/');
    expect(paths.portfolio).toBe('/portfolio');
    expect(paths.contact).toBe('/contact');
    expect(paths.article('3')).toBe('/portfolio/3');
  });

  it('meng-encode ID artikel yang mengandung karakter khusus', () => {
    expect(paths.article('a b/c')).toBe('/portfolio/a%20b%2Fc');
  });
});

describe('useLocation', () => {
  it('membaca pathname, query string, dan searchParams dari URL', () => {
    window.history.replaceState(null, '', '/portfolio?kategori=Layanan+Publik&halaman=2');
    const { result } = renderHook(() => useLocation());

    expect(result.current.pathname).toBe('/portfolio');
    expect(result.current.search).toBe('?kategori=Layanan+Publik&halaman=2');
    expect(result.current.searchParams.get('kategori')).toBe('Layanan Publik');
    expect(result.current.searchParams.get('halaman')).toBe('2');
    expect(result.current.searchParams.get('tidak-ada')).toBeNull();
  });

  it.each([
    ['/portfolio/', '/portfolio'],
    ['/portfolio///', '/portfolio'],
    ['/contact/', '/contact'],
    ['/', '/'],
    ['/portfolio/3/', '/portfolio/3'],
  ])('menormalkan garis miring di akhir: %s -> %s', (url, expected) => {
    window.history.replaceState(null, '', url);
    const { result } = renderHook(() => useLocation());
    expect(result.current.pathname).toBe(expected);
  });

  it('mengembalikan search kosong bila tidak ada query', () => {
    window.history.replaceState(null, '', '/contact');
    const { result } = renderHook(() => useLocation());
    expect(result.current.search).toBe('');
  });

  it('merender ulang saat navigate() dipanggil', () => {
    const { result } = renderHook(() => useLocation());
    expect(result.current.pathname).toBe('/');
    act(() => navigate('/contact'));
    expect(result.current.pathname).toBe('/contact');
    expect(window.location.pathname).toBe('/contact');
  });

  it('merender ulang saat tombol Back/Forward browser dipakai (popstate)', () => {
    const { result } = renderHook(() => useLocation());
    act(() => {
      window.history.pushState(null, '', '/portfolio/9');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.pathname).toBe('/portfolio/9');
  });
});

describe('navigate', () => {
  it('menambah entri riwayat dan menggulir ke atas secara instan', () => {
    const before = window.history.length;
    navigate('/contact');
    expect(window.history.length).toBe(before + 1);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
  });

  it('tidak menambah riwayat bila URL sama', () => {
    navigate('/contact');
    const before = window.history.length;
    navigate('/contact');
    expect(window.history.length).toBe(before);
  });

  it('mempertimbangkan query string saat membandingkan URL', () => {
    navigate('/portfolio');
    const before = window.history.length;
    navigate('/portfolio?halaman=2');
    expect(window.history.length).toBe(before + 1);
  });

  it('replace: mengganti entri tanpa menambah riwayat', () => {
    const before = window.history.length;
    navigate('/contact', { replace: true });
    expect(window.history.length).toBe(before);
    expect(window.location.pathname).toBe('/contact');
  });

  it('scroll: false tidak menggulir', () => {
    navigate('/contact', { scroll: false });
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});

/**
 * Mengklik elemen lalu melaporkan apakah APLIKASI sudah memanggil preventDefault.
 * Listener di document berjalan setelah handler React, lalu membatalkan navigasi bawaan
 * agar jsdom tidak mencetak "Not implemented: navigation".
 */
function clickAndReport(element: Element, init?: MouseEventInit) {
  let preventedByApp = false;
  const interceptor = (event: Event) => {
    preventedByApp = event.defaultPrevented;
    event.preventDefault();
  };
  document.addEventListener('click', interceptor);
  fireEvent.click(element, init);
  document.removeEventListener('click', interceptor);
  return preventedByApp;
}

describe('Link', () => {
  it('merender <a> asli dengan href', () => {
    render(<Link to="/portfolio/3">Baca</Link>);
    expect(screen.getByRole('link', { name: 'Baca' })).toHaveAttribute('href', '/portfolio/3');
  });

  it('klik biasa berpindah halaman tanpa memuat ulang browser', async () => {
    const user = userEvent.setup();
    render(<Link to="/contact">Kontak</Link>);

    await user.click(screen.getByRole('link', { name: 'Kontak' }));
    expect(window.location.pathname).toBe('/contact');
  });

  it('klik biasa memanggil preventDefault (navigasi ditangani router)', () => {
    render(<Link to="/contact">Kontak</Link>);
    expect(clickAndReport(screen.getByRole('link'))).toBe(true);
    expect(window.location.pathname).toBe('/contact');
  });

  it.each(['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] as const)(
    'klik dengan %s dibiarkan ke browser (tab baru/jendela baru)',
    (modifier) => {
      render(<Link to="/contact">Kontak</Link>);
      expect(clickAndReport(screen.getByRole('link'), { [modifier]: true })).toBe(false);
      expect(window.location.pathname).toBe('/');
    },
  );

  it('klik tengah (button 1) dibiarkan ke browser', () => {
    render(<Link to="/contact">Kontak</Link>);
    expect(clickAndReport(screen.getByRole('link'), { button: 1 })).toBe(false);
    expect(window.location.pathname).toBe('/');
  });

  it('target="_blank" dibiarkan ke browser', () => {
    render(
      <Link to="/contact" target="_blank">
        Kontak
      </Link>,
    );
    expect(clickAndReport(screen.getByRole('link'))).toBe(false);
    expect(window.location.pathname).toBe('/');
  });

  it('memanggil onNavigate setelah berpindah', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <Link to="/contact" onNavigate={onNavigate}>
        Kontak
      </Link>,
    );

    await user.click(screen.getByRole('link'));
    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it('onClick yang memanggil preventDefault membatalkan navigasi', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      // jsx-a11y memetakan Link ke <a> tanpa href (prop kita `to`), sehingga onClick dianggap
      // pada elemen statis. Link selalu menjadi <a href> sungguhan; ini memang uji onClick-nya.
      /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
      <Link to="/contact" onClick={(event) => event.preventDefault()} onNavigate={onNavigate}>
        Kontak
      </Link>,
      /* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
    );

    await user.click(screen.getByRole('link'));
    expect(window.location.pathname).toBe('/');
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('meneruskan atribut lain (className, aria-*)', () => {
    render(
      <Link to="/" className="x" aria-current="page">
        Beranda
      </Link>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveClass('x');
    expect(link).toHaveAttribute('aria-current', 'page');
  });
});
