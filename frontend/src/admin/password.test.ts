import { describe, expect, it } from 'vitest';
import { generatePassword, validateNewPassword } from './password';

describe('validateNewPassword', () => {
  it.each([
    ['', 'Kata sandi wajib diisi'],
    ['Pendek1a', 'Kata sandi minimal 12 karakter'],
    ['semuahurufkecil1', 'Kata sandi harus memuat huruf besar dan huruf kecil'],
    ['SEMUAHURUFBESAR1', 'Kata sandi harus memuat huruf besar dan huruf kecil'],
    ['TanpaAngkaSama', 'Kata sandi harus memuat angka'],
  ])('menolak %j', (password, message) => {
    expect(validateNewPassword(password)).toBe(message);
  });

  it('menerima kata sandi yang memenuhi semua aturan', () => {
    expect(validateNewPassword('KataSandi2026Baru')).toBeNull();
  });
});

describe('generatePassword', () => {
  it('selalu memenuhi aturan kata sandi dan berpanjang 16 karakter', () => {
    for (let i = 0; i < 200; i += 1) {
      const password = generatePassword();
      expect(password).toHaveLength(16);
      expect(validateNewPassword(password), password).toBeNull();
    }
  });

  it('tidak memuat karakter yang mudah tertukar', () => {
    for (let i = 0; i < 100; i += 1) expect(generatePassword()).not.toMatch(/[IlO01]/);
  });

  it('menghasilkan nilai berbeda setiap kali dipanggil', () => {
    const results = new Set(Array.from({ length: 50 }, () => generatePassword()));
    expect(results.size).toBe(50);
  });
});
