import { afterEach, describe, expect, it } from 'vitest';
import { formatDate } from './format';

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
