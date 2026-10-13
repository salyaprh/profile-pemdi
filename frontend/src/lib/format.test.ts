import { afterEach, describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from './format';

describe('formatDate', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it('memformat tanggal ISO ke bahasa Indonesia', () => {
    expect(formatDate('2025-01-24')).toBe('24 Januari 2025');
    expect(formatDate('2024-12-01')).toBe('1 Desember 2024');
    expect(formatDate('2024-10-25')).toBe('25 Oktober 2024');
  });

  it('tidak bergeser sehari pada zona waktu di barat UTC (regresi timeZone: UTC)', () => {
    // Tanpa timeZone: 'UTC', tengah malam UTC tampil sebagai hari sebelumnya di Amerika.
    process.env.TZ = 'America/Los_Angeles';
    expect(formatDate('2025-01-01')).toBe('1 Januari 2025');
  });
});

describe('formatDateTime', () => {
  it('menampilkan waktu UTC dari server dalam WIB, apa pun zona waktu browser', () => {
    expect(formatDateTime('2026-10-13T07:05:00Z')).toBe('13 Okt 2026, 14.05 WIB');
    // 20.30 UTC sudah berganti hari di Jakarta.
    expect(formatDateTime('2026-10-13T20:30:00+00:00')).toBe('14 Okt 2026, 03.30 WIB');
  });
});
