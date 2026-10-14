import { describe, expect, it } from 'vitest';
import {
  MESSAGE_MAX_LENGTH,
  isEmptyPhone,
  validateEmail,
  validateMessage,
  validateName,
  validateOptionalPhone,
  validateSubject,
} from './validators';

describe('validateName', () => {
  it.each([
    ['', false],
    ['   ', false],
    ['Bu', false],
    ['Budi', true],
    ['  Budi Santoso  ', true],
  ])('%j -> valid: %s', (value, isValid) => {
    expect(validateName(value).isValid).toBe(isValid);
  });

  it('memberi pesan yang sesuai', () => {
    expect(validateName('').message).toBe('Nama lengkap wajib diisi');
    expect(validateName('Bu').message).toBe('Minimal 3 karakter');
    expect(validateName('Budi').message).toBe('');
  });
});

describe('validateEmail', () => {
  it.each([
    ['budi@instansi.go.id', true],
    ['  budi@instansi.go.id  ', true],
    ['a@b.co', true],
    ['', false],
    ['budi', false],
    ['budi@', false],
    ['budi@instansi', false],
    ['budi @instansi.go.id', false],
    ['@instansi.go.id', false],
  ])('%j -> valid: %s', (value, isValid) => {
    expect(validateEmail(value).isValid).toBe(isValid);
  });

  it('membedakan email kosong dan format salah', () => {
    expect(validateEmail('').message).toBe('Email wajib diisi');
    expect(validateEmail('budi@instansi').message).toBe('Format email tidak valid');
  });
});

describe('isEmptyPhone', () => {
  it.each([
    ['', true],
    ['+62', true],
    ['+1', true],
    ['+971', true],
    ['+621', true], // paling banyak 3 angka dianggap belum ada nomor
    ['+6281', false],
    ['081234567890', false],
  ])('%j -> kosong: %s', (value, empty) => {
    expect(isEmptyPhone(value)).toBe(empty);
  });
});

describe('validateOptionalPhone', () => {
  it.each([
    ['', true],
    ['+62', true],
    ['0812345678', true], // tepat 10 digit
    ['+6287886683355', true],
    ['+62 878-8668-3355', true], // spasi dan strip diabaikan
    ['(021) 5551234', true],
    ['123456789012345', true], // tepat 15 digit
    ['081234567', false], // 9 digit
    ['1234567890123456', false], // 16 digit
    ['08123abc7890', false],
    ['+6281', false],
  ])('%j -> valid: %s', (value, isValid) => {
    expect(validateOptionalPhone(value).isValid).toBe(isValid);
  });

  it('menjelaskan aturan digit', () => {
    expect(validateOptionalPhone('081234567').message).toBe('Nomor ponsel harus 10-15 digit angka');
  });
});

describe('validateSubject', () => {
  it('wajib diisi', () => {
    expect(validateSubject('').isValid).toBe(false);
    expect(validateSubject('   ').message).toBe('Subjek wajib diisi');
    expect(validateSubject('Kolaborasi').isValid).toBe(true);
  });
});

describe('validateMessage', () => {
  it('menolak pesan kosong dan terlalu pendek', () => {
    expect(validateMessage('').message).toBe('Pesan wajib diisi');
    expect(validateMessage('         ').message).toBe('Pesan wajib diisi');
    expect(validateMessage('123456789').message).toBe('Pesan minimal 10 karakter');
  });

  it('menerima batas bawah dan batas atas', () => {
    expect(validateMessage('1234567890').isValid).toBe(true);
    expect(validateMessage('x'.repeat(MESSAGE_MAX_LENGTH)).isValid).toBe(true);
  });

  it('menolak pesan melebihi batas maksimum', () => {
    const result = validateMessage('x'.repeat(MESSAGE_MAX_LENGTH + 1));
    expect(result.isValid).toBe(false);
    expect(result.message).toBe(`Pesan maksimal ${MESSAGE_MAX_LENGTH} karakter`);
  });
});
