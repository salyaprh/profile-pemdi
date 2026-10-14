import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('menampilkan judul sebagai heading dan deskripsi', () => {
    render(<EmptyState title="Belum ada data" description="Coba lagi nanti." />);
    expect(screen.getByRole('heading', { name: 'Belum ada data' })).toBeInTheDocument();
    expect(screen.getByText('Coba lagi nanti.')).toBeInTheDocument();
  });

  it('menampilkan CTA hanya bila diberikan', () => {
    const { rerender } = render(<EmptyState title="A" description="B" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(
      <EmptyState title="A" description="B" action={<button type="button">Atur ulang</button>} />,
    );
    expect(screen.getByRole('button', { name: 'Atur ulang' })).toBeInTheDocument();
  });

  it('ikon bersifat dekoratif (tidak dibacakan pembaca layar)', () => {
    const { container } = render(<EmptyState title="A" description="B" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
