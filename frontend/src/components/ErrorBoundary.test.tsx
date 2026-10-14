import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function Bomb(): never {
  throw new Error('meledak saat render');
}

describe('ErrorBoundary', () => {
  it('menampilkan anak apa adanya bila tidak ada error', () => {
    render(
      <ErrorBoundary>
        <p>Konten normal</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Konten normal')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('menampilkan halaman bantuan (bukan layar putih) saat anak error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Halaman ini sedang bermasalah' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Muat ulang halaman' })).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('menyediakan tautan ke beranda berupa <a href> biasa (tidak bergantung router)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toHaveAttribute('href', '/');
  });

  it('mencatat error beserta component stack lewat console.error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    const logged = consoleError.mock.calls.find((call) => call[0] === '[ErrorBoundary]');
    expect(logged).toBeDefined();
    expect((logged?.[1] as Error).message).toBe('meledak saat render');
  });

  it('error pada satu anak tidak menampilkan anak lain (seluruh subtree diganti fallback)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <p>Saudara</p>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.queryByText('Saudara')).not.toBeInTheDocument();
  });
});
