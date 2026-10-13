import { describe, expect, it } from 'vitest';
import { adminNavItems, navItemsFor, safeReturnPath } from './navigation';

describe('safeReturnPath', () => {
  it.each([
    ['/admin', '/admin'],
    ['/admin/artikel?status=draf', '/admin/artikel?status=draf'],
    ['/admin/artikel/12#isi', '/admin/artikel/12#isi'],
  ])('menerima path di dalam panel admin: %s', (value, expected) => {
    expect(safeReturnPath(value)).toBe(expected);
  });

  it.each([
    [null],
    [''],
    ['https://situs-jahat.example/admin'],
    ['//situs-jahat.example/admin'],
    ['/portfolio'],
    ['/adminpalsu'],
    ['/admin/masuk'],
    ['/admin/masuk?kembali=/admin'],
    ['javascript:alert(1)'],
  ])('menolak tujuan di luar panel atau halaman Masuk itu sendiri: %s', (value) => {
    expect(safeReturnPath(value)).toBe('/admin');
  });
});

describe('navItemsFor', () => {
  it('label menu maksimal 2 kata (pola Sidebar IDDS)', () => {
    for (const item of adminNavItems) {
      expect(item.label.split(/\s+/).length, item.label).toBeLessThanOrEqual(2);
    }
  });

  it('Dasbor tersedia untuk semua peran', () => {
    expect(navItemsFor('admin').map((item) => item.label)).toContain('Dasbor');
    expect(navItemsFor('penulis').map((item) => item.label)).toContain('Dasbor');
  });
});
