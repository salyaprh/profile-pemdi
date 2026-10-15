# PEMDI PANRB — Profil Pemerintah Digital

Situs profil PEMDI / PANRB beserta CMS (sistem pengelolaan konten) agar staf dapat mengelola artikel dan konten situs tanpa developer. Tampilan mengikuti [INA Digital Design System (IDDS)](https://design.inadigital.go.id/).

## Struktur

| Folder                   | Isi                                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| [`frontend/`](frontend/) | Situs publik (React 19 + TypeScript + Vite + IDDS) dan panel admin CMS. Lihat [README frontend](frontend/README.md).   |
| [`backend/`](backend/)   | API CMS (Laravel 13, PHP 8.3+): login, pengelolaan konten, formulir kontak. Lihat [README backend](backend/README.md). |
| [`deploy/`](deploy/)     | Konfigurasi Nginx dan panduan memasang di server. Lihat [panduan deploy](deploy/README.md).                            |
| [`docs/`](docs/)         | [Panduan admin](docs/panduan-admin.md) untuk tim konten (menulis, meninjau, mengelola akun).                           |
| [`.github/`](.github/)   | CI (frontend, backend PHP 8.3 dan 8.5, e2e) dan Dependabot.                                                            |

Di produksi, frontend dan backend disajikan dari **satu origin** lewat Nginx: berkas statis frontend untuk halaman, dan Laravel (PHP-FPM) untuk `/api`. Dengan begitu login memakai cookie sesi + CSRF tanpa CORS, dan CSP `connect-src 'self'` tetap ketat.

## Menjalankan di lokal

Butuh Node.js 22.12+, PHP 8.3+, dan Composer.

```bash
cd backend && composer setup && php artisan db:seed && composer dev   # API di http://localhost:8000
```

```bash
cd frontend && npm install && npm run dev                             # situs di http://localhost:5173
```

Backend wajib berjalan: situs publik juga mengambil artikel, kategori, dan formulir kontak dari API.

Panel admin ada di `http://localhost:5173/admin`. Akun demo lokal dijelaskan di [README backend](backend/README.md#menjalankan). Masuk sebagai Penulis untuk menulis dan mengajukan artikel, lalu sebagai Admin untuk meninjau dan menerbitkannya.

## Rencana CMS

Dikerjakan bertahap, satu PR per fase:

| Fase | Isi                                                                                                          | Status                                  |
| ---- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| 0    | Monorepo `frontend/` + `backend/`, kerangka Laravel, CI backend                                              | Selesai                                 |
| 1    | Database, login (sesi cookie + CSRF), peran Admin dan Penulis, log aktivitas, halaman Masuk dan dasbor admin | Selesai                                 |
| 2    | CRUD artikel dan kategori dengan editor WYSIWYG (TipTap), unggah gambar, alur tinjauan                       | Selesai                                 |
| 3    | Situs publik membaca konten dari database; formulir kontak tersimpan di kotak masuk admin                    | Selesai                                 |
| 4    | Pengelolaan pengguna, pengaturan situs, halaman log aktivitas                                                | Selesai                                 |
| 5    | Siap dipasang di server PANRB: Nginx, header keamanan, pratinjau tautan, panduan deploy                      | Kode siap; menunggu uji di server PANRB |

## Pengembangan

Semua pemeriksaan ini dijalankan CI pada setiap PR dan harus hijau:

| Bagian   | Perintah                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| Frontend | `npm run format:check`, `lint`, `knip` (kode mati), `typecheck`, `test` (Vitest), `build`, `test:e2e` (Playwright) |
| Backend  | `composer lint` (Pint), `analyse` (Larastan level 6), `test` (PHPUnit), `audit`                                    |

Menambah fitur baru di panel admin, urutan yang dipakai di semua fase:

1. **Kontrak API dulu**: tipe dan hook di `frontend/src/admin/<sumber>/api.ts` (komentar menyebut controller backend-nya), dan data tiruan MSW untuk uji.
2. **Halaman** di `frontend/src/admin/pages/`, didaftarkan di tabel rute `AdminApp.tsx` (tandai `adminOnly` bila khusus Admin) dan, bila perlu, di `navigation.ts`. Pakai komponen bersama (`LoadError`, `SelectField`, `DataTable`, `ConfirmDialog`, `FilterChips`) alih-alih menyalin markup.
3. **Backend**: rute di `backend/routes/api.php` di dalam grup `admin` (otomatis `auth`, `active`, `password.changed`; tambahkan `admin` untuk khusus Admin dan daftarkan di `OPEN_TO_PENULIS` pada `AdminRoutesSecurityTest` bila terbuka bagi Penulis), FormRequest untuk validasi, Resource untuk bentuk respons, dan `ActivityAction` baru bila aksinya perlu dicatat.
4. **Uji**: PHPUnit untuk hak akses dan validasi, Vitest untuk halaman, Playwright untuk alur penting beserta audit axe.

Prinsip keamanan yang dijaga uji otomatis: hak akses ditentukan backend (frontend hanya menyembunyikan), semua isi pengguna dirender sebagai teks (HTML artikel disaring server), tautan dari data pengguna di-encode atau dibatasi `https`, rahasia tidak pernah masuk log aktivitas, dan API publik tidak membuat cookie.
