# PEMDI PANRB — Profil Pemerintah Digital

Situs profil PEMDI / PANRB (Pemerintah Digital) yang menampilkan karya dan inisiatif TDP. Dibangun dengan [INA Digital Design System (IDDS)](https://design.inadigital.go.id/) dan tema brand **INAgov** (kebiruan; logo tetap PANRB).

## Stack

- React 19 + TypeScript (strict) + Vite 7
- Tailwind CSS v4 dengan token IDDS (`@idds/styles`)
- [`@idds/react`](https://design.inadigital.go.id/getting-started/code/react/) untuk komponen, `@tabler/icons-react` untuk ikon
- Font Inter di-self-host lewat `@fontsource/inter` (tanpa Google Fonts)
- Router kecil buatan sendiri berbasis History API (`src/lib/router.tsx`), tanpa dependency tambahan

## Menjalankan

Butuh Node.js 20.19+ atau 22.12+ (syarat Vite 7).

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # typecheck + build produksi ke dist/
npm run preview        # pratinjau hasil build

npm run typecheck      # tsc untuk src/, konfigurasi build, dan e2e
npm run lint           # ESLint (type-aware, react-hooks, jsx-a11y, testing-library, playwright)
npm run format         # Prettier (format:check untuk memeriksa saja)
npm test               # Vitest: uji unit dan komponen (test:watch, test:coverage)
npm run test:e2e       # Playwright: uji end-to-end terhadap build produksi (butuh: npx playwright install chromium)
```

## Pengujian

| Lapisan         | Alat                                    | Cakupan                                                                                                                                                                                                                                                                                                                                           |
| --------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit & komponen | Vitest + Testing Library + jsdom        | Logika (validator, data, router, SEO), komponen dan halaman dengan komponen IDDS asli (tidak di-mock), serta invarian keamanan: CSP di `public/_headers` tanpa `unsafe-inline`/host eksternal, hash style IDDS dihitung dari paket terpasang, dan CSP Nginx identik dengan `_headers`                                                             |
| End-to-end      | Playwright (Chromium, desktop + mobile) | Build produksi dilayani dengan header dari `_headers`. Setiap uji otomatis gagal bila ada error konsol, pelanggaran CSP, atau permintaan ke origin lain. Mencakup routing, pencarian, formulir (sukses, 500, jaringan putus, klik ganda), layout, SEO, keamanan, dan audit aksesibilitas axe WCAG 2.2 AA pada semua halaman dan status interaktif |

Uji ditulis agar dapat gagal: kualitasnya diperiksa dengan uji mutasi manual (menyisipkan bug yang masuk akal, lalu memastikan uji menangkapnya).

CI (`.github/workflows/ci.yml`) menjalankan dua job paralel pada setiap PR: `check` (audit dependency produksi, Prettier, ESLint, typecheck, Vitest, build, guard bundle bebas Google Fonts) dan `e2e` (Playwright). Dependabot memperbarui dependency dan GitHub Actions tiap pekan; pembaruan mayor yang sengaja ditahan (beserta alasannya) tercatat di `.github/dependabot.yml`.

## Rute

| Path             | Halaman                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `/`              | Beranda                                                                                      |
| `/portfolio`     | Daftar portofolio. Filter dan halaman tersimpan di URL: `?kategori=Layanan+Publik&halaman=2` |
| `/portfolio/:id` | Detail artikel + artikel terkait                                                             |
| `/contact`       | Formulir "Hubungi kami"                                                                      |
| lainnya          | Halaman 404 (`noindex`)                                                                      |

## Struktur

```
src/
  main.tsx            entry: font, tema IDDS (setBrandTheme('inagov')), ErrorBoundary, ToastProvider
  App.tsx             pemetaan rute -> halaman
  index.css           Tailwind, token IDDS, skala tipografi IDDS
  components/         Header, Footer, SearchBar, PaginationNav, ArticleCard, ButtonLink, EmptyState, ErrorBoundary, Layout
  pages/              Home, Articles (portofolio), ArticleDetail, Contact, NotFound
  data/               articlesData.ts (data dummy + helper), siteContent.ts (menu, footer, statistik)
  lib/                router.tsx, seo.ts (title/meta per halaman), validators.ts, format.ts
  services/           contact.ts (pengiriman formulir)
vite-plugins/         selfHostFonts.ts (buang @import Google Fonts dari CSS IDDS), seo.ts (robots.txt + sitemap.xml)
public/               panrb.svg, images/articles/*, _headers (header keamanan + cache)
deploy/               nginx.conf.example (hosting sendiri/PDN)
.github/              ci.yml, dependabot.yml
```

## Variabel lingkungan

Salin `.env.example` menjadi `.env.local`. Semua variabel `VITE_*` **tertanam di bundle dan bersifat publik**: jangan menyimpan secret (API key, token) di sini.

| Variabel                | Fungsi                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SITE_URL`         | URL produksi tanpa path (mis. `https://pemdi.panrb.go.id`). Mengaktifkan `canonical`, `og:url`, dan `sitemap.xml`. Atur di environment build **Production** hosting Anda. |
| `VITE_CONTACT_ENDPOINT` | Endpoint `POST` JSON penerima pesan formulir kontak.                                                                                                                      |

### Formulir kontak

Formulir **belum terhubung ke server**. `POST` ke `VITE_CONTACT_ENDPOINT` dengan JSON:

```json
{ "name": "", "email": "", "phone": "", "subject": "", "message": "" }
```

Selama variabel ini kosong, pengguna melihat pemberitahuan bahwa pesan belum dikirim (tidak berpura-pura terkirim). Respons non-2xx atau kegagalan jaringan menampilkan pesan gagal.

Gunakan endpoint **se-origin** (mis. `/api/contact`) agar CSP `connect-src 'self'` tidak perlu dilonggarkan. Endpoint wajib melakukan validasi di sisi server, pembatasan laju (rate limit), dan anti-spam; validasi di browser hanya untuk kenyamanan pengguna.

## Deploy

Hasil build adalah situs statis (`dist/`). Persyaratan hosting:

1. **SPA fallback**: path tak dikenal harus dilayani `index.html`.
2. **Header keamanan** dari `public/_headers` (CSP ketat, HSTS, `nosniff`, `frame-ancestors 'none'`, dll.) dan cache panjang untuk `/assets/*`.

| Hosting                            | Cara                                                                                                                                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudflare Pages** (rekomendasi) | `public/_headers` terbaca otomatis. SPA fallback bawaan **selama tidak ada `404.html` di root** (jangan menambahkannya, dan tidak perlu `_redirects`). Build: `npm run build`, output: `dist`. |
| **Netlify**                        | `_headers` terbaca otomatis; tambahkan `public/_redirects` berisi `/* /index.html 200`.                                                                                                        |
| **Vercel**                         | Terjemahkan isi `_headers` ke `vercel.json` (`headers`) dan tambahkan `rewrites` ke `/index.html`.                                                                                             |
| **Server sendiri / PDN**           | Lihat `deploy/nginx.conf.example` (belum diuji di server nyata).                                                                                                                               |

Catatan:

- `_headers` **tidak berlaku untuk respons fungsi serverless** (mis. `/api/*` di Cloudflare Pages Functions); pasang header di kode fungsi.
- CSP mengizinkan satu `<style>` inline milik `@idds/react` (animasi `Skeleton`) lewat hash. Setelah upgrade `@idds/react`, bila konsol melaporkan pelanggaran `style-src`, perbarui hash di `public/_headers` (dan `deploy/nginx.conf.example`) sesuai pesan di konsol. Animasinya tetap jalan karena `@keyframes shimmer` juga ada di `src/index.css`.
- Pastikan HTTPS aktif sebelum mengandalkan HSTS.

## SEO dan pratinjau tautan

- `<title>`, deskripsi, `canonical`, dan `og:*` per halaman diatur `src/lib/seo.ts` di browser. Mesin pencari yang menjalankan JavaScript membacanya.
- `robots.txt` dan `sitemap.xml` dibuat saat build (`sitemap.xml` hanya bila `VITE_SITE_URL` diisi).
- **Keterbatasan:** pratinjau tautan (WhatsApp, dll.) tidak menjalankan JavaScript sehingga hanya melihat meta statis di `index.html`. Pratinjau per artikel dan `og:image` membutuhkan prerender/SSG dan aset gambar 1200×630 resmi.

## Acuan desain

Seluruh tampilan mengacu ke IDDS. Gunakan token, bukan warna hex langsung:

- Warna: `text-content-*`, `border-stroke-*`, `bg-background-*`, `primary-*` (mengikuti tema aktif: INAgov biru), `guide-*` (biru informatif) — [Warna](https://design.inadigital.go.id/foundation/color/)
- Tipografi (Inter): utilitas `text-display-*`, `text-h1`..`text-h5`, `text-body*`, `text-caption*` yang didefinisikan di `src/index.css` — [Tipografi](https://design.inadigital.go.id/foundation/typography/)
- Pola yang dipakai: [Header](https://design.inadigital.go.id/pattern/header/guide/), [Footer](https://design.inadigital.go.id/pattern/footer/guide/), [Searchbar](https://design.inadigital.go.id/pattern/searchbar/guide/), [Blog Section](https://design.inadigital.go.id/pattern/blog-section/guide/), [Blog Post](https://design.inadigital.go.id/pattern/blog-post/guide/), [404 Section](https://design.inadigital.go.id/pattern/404-section/guide/), [Empty State](https://design.inadigital.go.id/pattern/empty-state/guide/)
- Aksesibilitas mengikuti [WCAG 2.2 AA](https://design.inadigital.go.id/foundation/accessibility/): tautan semantik, skip link, fokus terlihat, `aria-current`. Dipantau otomatis oleh `e2e/a11y.spec.ts` (axe).

### Penyimpangan dari komponen IDDS (hasil audit axe)

Beberapa komponen IDDS (`@idds/react` 1.6.x) tidak lolos WCAG 2.2 AA yang diacu IDDS sendiri, sehingga ditangani di sisi kita. **Periksa lagi setelah upgrade `@idds/react`; sebaiknya dilaporkan ke tim IDDS (ux@inadigital.co.id).**

| Komponen IDDS            | Masalah                                                                                                                  | Penanganan                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `BasicDropdown`          | `<div role="button">` membungkus input dan tombol hapus (`nested-interactive`)                                           | `SearchBar` membuat panel hasil sendiri                                                            |
| `Pagination`             | tombol ikon tanpa nama (`button-name`), `<select>` tanpa nama (`select-name`), dan halaman lanjutan tidak dapat dirayapi | `PaginationNav`: tautan sungguhan, bergaya token IDDS                                              |
| `Accordion`              | konten tertutup hanya di-clip sehingga tautannya tetap dapat difokus lewat Tab (WCAG 2.4.7)                              | CSS di `src/index.css` (`visibility: hidden` dengan jeda animasi)                                  |
| `TextField` / `TextArea` | teks error `#f02d2d` di atas putih = 4,1:1 (butuh 4,5:1)                                                                 | override ke `negative-600` di `src/index.css`                                                      |
| `Button` (primer)        | warna hover lebih terang sehingga 4,3-4,4:1 dengan teks putih                                                            | hover/fokus digelapkan (`primary-600`) di `src/index.css`                                          |
| `TextField`              | `id="undefined"` bila tanpa `id`/`name`/label; input 21px dan tombol hapus kurang dari 24px (WCAG 2.5.8)                 | selalu beri `id`; `min-height`/`min-width` 24px di `src/index.css`                                 |
| `PhoneInput`             | daftar negara berperan sebagai input ARIA tanpa nama (`aria-input-field-name`)                                           | **belum dapat diperbaiki** (tidak ada prop); hanya selector itu dikecualikan di `e2e/a11y.spec.ts` |

Catatan: `Card` IDDS sudah membungkus `title` dalam `<h3>` dan `description` dalam `<p>`, jadi isi keduanya dengan `<span>`.

## Aset

- Gambar artikel di `public/images/articles/*.webp` berukuran **328×202 px**: resolusinya rendah dan akan tampak buram bila diperbesar (mis. di halaman detail pada layar retina). Ganti dengan gambar asli beresolusi lebih tinggi (disarankan ≥1200 px lebar) bila tersedia.
- `public/panrb.svg` sudah dioptimasi dengan svgo (presisi 3, ±51% lebih kecil saat transfer); versi asli ada di riwayat git.

## Data yang masih placeholder

- 36 artikel di `src/data/articlesData.ts` adalah data dummy; isi detail semua artikel masih memakai `placeholderContent` (isi `content` per artikel dari CMS/API).
- Angka statistik di beranda (`heroStats` di `src/data/siteContent.ts`) belum data resmi.
- Tautan media sosial di footer belum ada (URL resmi belum diketahui).
