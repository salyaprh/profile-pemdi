import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import PaginationNav, { getPageItems } from './PaginationNav';

const hrefFor = (page: number) => `/daftar?halaman=${page}`;

describe('getPageItems', () => {
  it('menampilkan semua halaman bila <= 7', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(2, 3)).toEqual([1, 2, 3]);
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it.each([
    [1, [1, 2, 3, 4, 5, 'gap-end', 20]],
    [3, [1, 2, 3, 4, 5, 'gap-end', 20]],
    [10, [1, 'gap-start', 9, 10, 11, 'gap-end', 20]],
    [18, [1, 'gap-start', 16, 17, 18, 19, 20]],
    [20, [1, 'gap-start', 16, 17, 18, 19, 20]],
  ])('halaman %i dari 20 memakai jendela dengan elipsis', (current, expected) => {
    expect(getPageItems(current, 20)).toEqual(expected);
  });

  it('selalu memuat halaman pertama, terakhir, dan halaman aktif tanpa duplikat', () => {
    for (let current = 1; current <= 20; current += 1) {
      const items = getPageItems(current, 20);
      const numbers = items.filter((item): item is number => typeof item === 'number');
      expect(numbers[0]).toBe(1);
      expect(numbers.at(-1)).toBe(20);
      expect(numbers).toContain(current);
      expect(new Set(numbers).size).toBe(numbers.length);
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    }
  });
});

describe('PaginationNav', () => {
  it('tidak merender apa pun bila hanya ada satu halaman', () => {
    const { container } = render(
      <PaginationNav currentPage={1} totalPages={1} hrefFor={hrefFor} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('merender navigasi ber-label dengan tautan bernama untuk setiap halaman', () => {
    render(<PaginationNav currentPage={2} totalPages={3} hrefFor={hrefFor} />);
    const nav = screen.getByRole('navigation', { name: 'Paginasi' });

    expect(within(nav).getByText('Halaman 2 dari 3')).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Halaman sebelumnya' })).toHaveAttribute(
      'href',
      '/daftar?halaman=1',
    );
    expect(within(nav).getByRole('link', { name: 'Halaman berikutnya' })).toHaveAttribute(
      'href',
      '/daftar?halaman=3',
    );
    expect(within(nav).getByRole('link', { name: 'Halaman 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Halaman 3' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('halaman pertama tidak punya tautan "sebelumnya"; halaman terakhir tidak punya "berikutnya"', () => {
    const { rerender } = render(<PaginationNav currentPage={1} totalPages={3} hrefFor={hrefFor} />);
    expect(screen.queryByRole('link', { name: 'Halaman sebelumnya' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Halaman berikutnya' })).toBeInTheDocument();

    rerender(<PaginationNav currentPage={3} totalPages={3} hrefFor={hrefFor} />);
    expect(screen.queryByRole('link', { name: 'Halaman berikutnya' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Halaman sebelumnya' })).toBeInTheDocument();
  });

  it('klik tautan berpindah halaman lewat router (tanpa memuat ulang)', async () => {
    const user = userEvent.setup();
    render(<PaginationNav currentPage={1} totalPages={3} hrefFor={hrefFor} />);

    await user.click(screen.getByRole('link', { name: 'Halaman 3' }));

    expect(window.location.pathname + window.location.search).toBe('/daftar?halaman=3');
  });

  it('elipsis bersifat dekoratif (disembunyikan dari pembaca layar)', () => {
    render(<PaginationNav currentPage={10} totalPages={20} hrefFor={hrefFor} />);
    const nav = screen.getByRole('navigation', { name: 'Paginasi' });
    expect(nav.querySelectorAll('li[aria-hidden="true"]')).toHaveLength(2);
  });
});
