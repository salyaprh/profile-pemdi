# PEMDI PANRB — Profil Pemerintah Digital

Situs profil PEMDI / PANRB beserta CMS (sistem pengelolaan konten) agar staf dapat mengelola artikel dan konten situs tanpa developer. Tampilan mengikuti [INA Digital Design System (IDDS)](https://design.inadigital.go.id/).

## Struktur

| Folder                   | Isi                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| [`frontend/`](frontend/) | Situs publik (React 19 + TypeScript + Vite + IDDS) dan nanti panel admin CMS. Lihat [README frontend](frontend/README.md). |
| [`backend/`](backend/)   | API CMS (Laravel 13, PHP 8.3+): login, pengelolaan konten, formulir kontak. Lihat [README backend](backend/README.md).     |
| [`deploy/`](deploy/)     | Contoh konfigurasi server (Nginx).                                                                                         |
| [`.github/`](.github/)   | CI (frontend, backend PHP 8.3 dan 8.5, e2e) dan Dependabot.                                                                |

Di produksi, frontend dan backend disajikan dari **satu origin** lewat Nginx: berkas statis frontend untuk halaman, dan Laravel (PHP-FPM) untuk `/api`. Dengan begitu login memakai cookie sesi + CSRF tanpa CORS, dan CSP `connect-src 'self'` tetap ketat.

## Menjalankan di lokal

Butuh Node.js 22.12+, PHP 8.3+, dan Composer.

```bash
cd backend && composer setup && composer dev    # API di http://localhost:8000
```

```bash
cd frontend && npm install && npm run dev       # situs di http://localhost:5173
```

## Rencana CMS

Dikerjakan bertahap, satu PR per fase:

| Fase | Isi                                                                                        | Status     |
| ---- | ------------------------------------------------------------------------------------------ | ---------- |
| 0    | Monorepo `frontend/` + `backend/`, kerangka Laravel, CI backend                            | Selesai    |
| 1    | Database, login (Sanctum SPA), peran Admin dan Penulis, log aktivitas, halaman Masuk admin | Berikutnya |
| 2    | CRUD artikel dan kategori dengan editor WYSIWYG (TipTap), unggah gambar, alur tinjauan     |            |
| 3    | Situs publik membaca konten dari database; formulir kontak tersimpan di kotak masuk admin  |            |
| 4    | Pengelolaan pengguna, pengaturan situs, halaman log aktivitas                              |            |
| 5    | Siap dipasang di server PANRB: Nginx, header keamanan, pratinjau tautan, panduan deploy    |            |
