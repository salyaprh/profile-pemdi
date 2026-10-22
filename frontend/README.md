# Frontend profile-pemdi

Situs profil PEMDI / PANRB (Pemerintah Digital) yang menampilkan karya dan inisiatif TDP. Dibangun dengan [INA Digital Design System (IDDS)](https://design.inadigital.go.id/) dan tema brand **INAgov** (kebiruan; logo tetap PANRB). Gambaran umum proyek (frontend + backend CMS) ada di [README utama](../README.md).

## Stack

- React 19 + TypeScript (strict) + Vite 7
- Tailwind CSS v4 dengan token IDDS (`@idds/styles`)
- [`@idds/react`](https://design.inadigital.go.id/getting-started/code/react/) untuk komponen, `@tabler/icons-react` untuk ikon
- Font Inter di-self-host lewat `@fontsource/inter` (tanpa Google Fonts)
- Router kecil buatan sendiri berbasis History API (`src/lib/router.tsx`), tanpa dependency tambahan
- Data dari API Laravel (artikel, kategori, kontak) memakai TanStack Query; tidak ada lagi konten yang ditulis di kode
- Panel admin CMS (`src/admin/`): dimuat terpisah dengan `React.lazy`
- Editor WYSIWYG [TipTap 3](https://tiptap.dev/) (MIT), hanya di bundle admin

## Menjalankan

Butuh Node.js 22.12+ (syarat Vite 7 dan jest-dom 7; Node 20 sudah EOL sejak April 2026).

```bash
npm install
npm run dev            # http://localhost:5173 (/api diteruskan ke backend di http://127.0.0.1:8000)
npm run build          # typecheck + build produksi ke dist/
npm run preview        # pratinjau hasil build

npm run typecheck      # tsc untuk src/, konfigurasi build, dan e2e
npm run lint           # ESLint (type-aware, react-hooks, jsx-a11y, testing-library, playwright)
npm run knip           # berkas, ekspor, dan dependency yang tidak terpakai
npm run format         # Prettier (format:check untuk memeriksa saja)
npm test               # Vitest: uji unit dan komponen (test:watch, test:coverage)
npm run test:e2e       # Playwright: build produksi + backend Laravel (butuh PHP 8.3+, composer install di ../backend, dan npx playwright install chromium)
```

Situs publik dan panel admin sama-sama butuh backend berjalan (`composer dev`, lihat [README backend](../backend/README.md)): semua konten diambil dari API. Atur `BACKEND_URL` bila backend tidak di port 8000.

## Pengujian

| Lapisan         | Alat                                    | Cakupan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit & komponen | Vitest + Testing Library + jsdom + MSW  | Logika (validator, data, router, SEO), komponen dan halaman dengan komponen IDDS asli (tidak di-mock), klien API (CSRF, 419, 422, galat jaringan) dan panel admin terhadap API tiruan MSW, serta invarian keamanan: CSP di `public/_headers` tanpa `unsafe-inline`/host eksternal, hash style IDDS dihitung dari paket terpasang, dan CSP Nginx identik dengan `_headers`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| End-to-end      | Playwright (Chromium, desktop + mobile) | Build produksi dilayani dengan header dari `_headers`, dan `/api` diteruskan ke backend Laravel sungguhan dengan database SQLite sementara (`e2e/start-backend.mjs`). Setiap uji otomatis gagal bila ada error konsol, pelanggaran CSP, atau permintaan ke origin lain. Mencakup routing, pencarian, formulir (sukses, 500, jaringan putus, klik ganda), login/logout dan sesi admin (cookie HttpOnly, CSRF 419), alur artikel lengkap (Penulis menulis dengan editor, tautan, dan gambar unggahan lalu mengajukan; Admin mengembalikan dengan catatan lalu menerbitkan; HTML tersimpan diperiksa hasil penyaring server), konfirmasi perubahan belum disimpan, toolbar editor dengan keyboard, CRUD kategori dan penolakan 403 untuk Penulis, siklus akun (Admin membuat akun, kata sandi sementara wajib diganti, sesi berakhir saat kata sandi diatur ulang atau akun dinonaktifkan), pengaturan situs yang langsung tampil di beranda dan footer, log aktivitas, artikel terbit langsung tampil di situs publik, formulir kontak tersimpan di server lalu dibaca dan dihapus di kotak masuk Admin, API publik tanpa cookie, sitemap dari backend, layout, SEO, keamanan, dan audit aksesibilitas axe WCAG 2.2 AA pada semua halaman dan status interaktif |

Uji ditulis agar dapat gagal: kualitasnya diperiksa dengan uji mutasi manual (menyisipkan bug yang masuk akal, lalu memastikan uji menangkapnya).

CI (`../.github/workflows/ci.yml`) menjalankan dua job frontend pada setiap PR: `frontend` (audit dependency produksi, Prettier, ESLint, typecheck, Vitest, build, guard bundle bebas Google Fonts) dan `e2e` (Playwright). Job `frontend` juga menjalankan `npm run knip` yang gagal bila ada berkas, ekspor, atau dependency yang tidak terpakai (konfigurasi di `knip.json`), jadi kode mati tidak menumpuk. Dependabot memperbarui dependency dan GitHub Actions tiap pekan; pembaruan mayor yang sengaja ditahan (beserta alasannya) tercatat di `../.github/dependabot.yml`.

`npm run format` juga merapikan `../.github/` dan `../README.md`; konfigurasi Prettier ada di root repo (`../.prettierrc.json`).

## Rute

| Path                                        | Halaman                                                                                            |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `/`                                         | Beranda                                                                                            |
| `/layanan`                                  | Layanan PEMDI (kartu per layanan, tautan ke platformnya); menu Layanan menaut ke `/layanan#<id>`   |
| `/portfolio`                                | Daftar portofolio. Filter (slug kategori) dan halaman di URL: `?kategori=layanan-publik&halaman=2` |
| `/portfolio/:slug`                          | Detail artikel + artikel terkait (404 bila tidak ada atau belum terbit)                            |
| `/contact`                                  | Formulir "Hubungi kami"                                                                            |
| `/admin/masuk`                              | Halaman Masuk CMS (`noindex`)                                                                      |
| `/admin`                                    | Dasbor CMS (perlu login; tamu diarahkan ke halaman Masuk dengan `?kembali=`)                       |
| `/admin/artikel`                            | Daftar artikel. Filter di URL: `?status=ditinjau&kategori=1&cari=spbe&halaman=2`                   |
| `/admin/artikel/baru`, `/admin/artikel/:id` | Tulis/edit artikel (editor WYSIWYG, gambar sampul, tombol alur tinjauan)                           |
| `/admin/pesan`, `/admin/pesan/:id`          | Kotak masuk formulir Hubungi kami (khusus Admin)                                                   |
| `/admin/kategori`                           | Kelola kategori (khusus Admin; Penulis melihat pemberitahuan "khusus Admin")                       |
| `/admin/pengguna`, `/baru`, `/:id`          | Daftar, tambah, dan ubah pengguna; atur ulang kata sandi (khusus Admin)                            |
| `/admin/pengaturan`                         | Pengaturan situs: deskripsi, tiga angka beranda, kontak, media sosial (khusus Admin)               |
| `/admin/aktivitas`                          | Log aktivitas, hanya bisa dibaca, dengan filter jenis (khusus Admin)                               |
| `/admin/akun`                               | Akun saya: ganti kata sandi. Satu-satunya halaman yang terbuka selama kata sandi masih sementara   |
| lainnya                                     | Halaman 404 (`noindex`)                                                                            |

## Struktur

```
src/
  main.tsx            entry: font, tema IDDS (setBrandTheme('inagov')), ErrorBoundary, ToastProvider
  App.tsx             pemetaan rute -> halaman
  index.css           Tailwind, token IDDS, skala tipografi IDDS
  components/         Header, NavDropdown (submenu Portofolio), Footer, SearchBar, PaginationNav, ArticleCard, ButtonLink, EmptyState, ErrorBoundary, Layout
  pages/              Home, Services (layanan), Articles (portofolio), ArticleDetail, Contact, NotFound
  data/               siteContent.ts (nama situs, deskripsi bawaan, menu utama, daftar layanan; isi situs lain diatur Admin di Pengaturan)
  lib/                router.tsx, seo.ts (title/meta per halaman), validators.ts, format.ts
  services/           api.ts (klien API: sesi cookie + CSRF, pesan galat), content.ts (kontrak + hook API publik),
                      contact.ts (formulir kontak), queryClient.ts
  admin/              panel CMS: AdminApp (rute admin + penjaga peran), AdminLayout (sidebar), RequireAuth,
                      auth (sesi), navigation (menu per peran), useUnsavedChangesGuard,
                      pages/ (satu berkas per halaman, mis. UsersPage.tsx), editor/ (RichTextEditor,
                      EditorToolbar, LinkDialog, ImageDialog, links.ts), components/ (ConfirmDialog,
                      LoadError, SelectField, DataTable, ImageFileInput, CoverImageField, StatusBadge, ...).
                      Satu folder per sumber data (articles, messages, users, settings, activity, account):
                      isinya api.ts = kontrak API + hook TanStack Query, dan tipe bila perlu
  test/               setup Vitest, server.ts (MSW), publicApi.ts (API publik tiruan bawaan), utils.tsx
vite-plugins/         selfHostFonts.ts (buang @import Google Fonts dari CSS IDDS), seo.ts (robots.txt)
public/               panrb.svg, images/articles/*, _headers (header keamanan + cache)
../deploy/            nginx.conf + README.md (hosting sendiri/PDN)
../.github/           ci.yml, dependabot.yml
```

## Variabel lingkungan

Salin `.env.example` menjadi `.env.local`. Semua variabel `VITE_*` **tertanam di bundle dan bersifat publik**: jangan menyimpan secret (API key, token) di sini.

| Variabel        | Fungsi                                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SITE_URL` | URL produksi tanpa path (mis. `https://pemdi.panrb.go.id`). Mengaktifkan `canonical`, `og:url`, dan baris Sitemap di `robots.txt`. Atur di environment build **Production** hosting Anda. |

### Formulir kontak

Formulir mengirim `POST /api/contact` ke backend (se-origin, tanpa sesi dan tanpa cookie) beserta token waktu dari `/api/contact/token` dan kolom jebakan bot yang tersembunyi. Aturan validasi di browser (`src/lib/validators.ts`) sama dengan di server dan diuji dengan kasus bersama (`src/lib/contact-validation-cases.json`). Galat 422 dari server ditampilkan di kolomnya; 429 dan gangguan jaringan ditampilkan sebagai toast. Pesan masuk dibaca Admin di `/admin/pesan`.

## Deploy

> **Sejak Fase 3 situs publik membutuhkan backend Laravel di origin yang sama** (artikel, kategori, formulir kontak, `sitemap.xml`). Hosting statis saja (Cloudflare Pages, Netlify, Vercel) tidak lagi cukup. **Jalur utama: server PANRB/PDN dengan `../deploy/nginx.conf`, panduannya di `../deploy/README.md`.** Tabel di bawah hanya berlaku untuk bagian statisnya.

Hasil build adalah berkas statis (`dist/`). Persyaratan hosting:

1. **SPA fallback**: path tak dikenal harus dilayani `index.html`.
2. **Header keamanan** dari `public/_headers` (CSP ketat, HSTS, `nosniff`, `frame-ancestors 'none'`, dll.) dan cache panjang untuk `/assets/*`.

| Hosting                  | Cara                                                                                                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudflare Pages**     | `public/_headers` terbaca otomatis. SPA fallback bawaan **selama tidak ada `404.html` di root** (jangan menambahkannya, dan tidak perlu `_redirects`). Build: `npm run build`, output: `dist`. |
| **Netlify**              | `_headers` terbaca otomatis; tambahkan `public/_redirects` berisi `/* /index.html 200`.                                                                                                        |
| **Vercel**               | Terjemahkan isi `_headers` ke `vercel.json` (`headers`) dan tambahkan `rewrites` ke `/index.html`.                                                                                             |
| **Server sendiri / PDN** | Lihat `../deploy/README.md` dan `../deploy/nginx.conf` (diuji di lokal, belum di server nyata).                                                                                                |

Catatan:

- `_headers` **tidak berlaku untuk respons fungsi serverless** (mis. `/api/*` di Cloudflare Pages Functions); pasang header di kode fungsi.
- CSP mengizinkan satu `<style>` inline milik `@idds/react` (animasi `Skeleton`) lewat hash. Setelah upgrade `@idds/react`, bila konsol melaporkan pelanggaran `style-src`, perbarui hash di `public/_headers` (dan `../deploy/nginx.conf`) sesuai pesan di konsol. Animasinya tetap jalan karena `@keyframes shimmer` juga ada di `src/index.css`.
- Pastikan HTTPS aktif sebelum mengandalkan HSTS.

## SEO dan pratinjau tautan

- `<title>`, deskripsi, `canonical`, dan `og:*` per halaman diatur `src/lib/seo.ts` di browser. Mesin pencari yang menjalankan JavaScript membacanya.
- `robots.txt` dibuat saat build (baris Sitemap hanya bila `VITE_SITE_URL` diisi). `sitemap.xml` dibuat backend dari artikel terbit di database, jadi artikel baru langsung masuk tanpa build ulang.
- Pratinjau tautan (WhatsApp, dll.) tidak menjalankan JavaScript. Karena itu `/portfolio/{slug}` dilayani backend Laravel (`ArticlePageController`), yang menyisipkan judul, deskripsi, `canonical`, `og:*`, dan `og:image` 1200×630 artikel ke `index.html`. Halaman lain memakai meta statis tingkat situs.

## Acuan desain

Seluruh tampilan mengacu ke IDDS. Gunakan token, bukan warna hex langsung:

- Warna: `text-content-*`, `border-stroke-*`, `bg-background-*`, `primary-*` (mengikuti tema aktif: INAgov biru), `guide-*` (biru informatif) — [Warna](https://design.inadigital.go.id/foundation/color/)
- Tipografi (Inter): utilitas `text-display-*`, `text-h1`..`text-h5`, `text-body*`, `text-caption*` yang didefinisikan di `src/index.css` — [Tipografi](https://design.inadigital.go.id/foundation/typography/)
- Pola yang dipakai: [Header](https://design.inadigital.go.id/pattern/header/guide/), [Footer](https://design.inadigital.go.id/pattern/footer/guide/), [Searchbar](https://design.inadigital.go.id/pattern/searchbar/guide/), [Blog Section](https://design.inadigital.go.id/pattern/blog-section/guide/), [Blog Post](https://design.inadigital.go.id/pattern/blog-post/guide/), [404 Section](https://design.inadigital.go.id/pattern/404-section/guide/), [Empty State](https://design.inadigital.go.id/pattern/empty-state/guide/)
- Aksesibilitas mengikuti [WCAG 2.2 AA](https://design.inadigital.go.id/foundation/accessibility/): tautan semantik, skip link, fokus terlihat, `aria-current`. Dipantau otomatis oleh `e2e/a11y.spec.ts` (axe).

### Penyimpangan dari komponen IDDS (hasil audit axe)

Beberapa komponen IDDS (`@idds/react` 1.6.x) tidak lolos WCAG 2.2 AA yang diacu IDDS sendiri, sehingga ditangani di sisi kita. **Periksa lagi setelah upgrade `@idds/react`; sebaiknya dilaporkan ke tim IDDS (ux@inadigital.co.id).**

| Komponen IDDS            | Masalah                                                                                                                     | Penanganan                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `BasicDropdown`          | `<div role="button">` membungkus input dan tombol hapus (`nested-interactive`)                                              | `SearchBar` membuat panel hasil sendiri                                                                        |
| `Pagination`             | tombol ikon tanpa nama (`button-name`), `<select>` tanpa nama (`select-name`), dan halaman lanjutan tidak dapat dirayapi    | `PaginationNav`: tautan sungguhan, bergaya token IDDS                                                          |
| `Accordion`              | konten tertutup hanya di-clip sehingga tautannya tetap dapat difokus lewat Tab (WCAG 2.4.7)                                 | CSS di `src/index.css` (`visibility: hidden` dengan jeda animasi)                                              |
| `TextField` / `TextArea` | teks error `#f02d2d` di atas putih = 4,1:1 (butuh 4,5:1)                                                                    | override ke `negative-600` di `src/index.css`                                                                  |
| `Button` (primer)        | warna hover lebih terang sehingga 4,3-4,4:1 dengan teks putih                                                               | hover/fokus digelapkan (`primary-600`) di `src/index.css`                                                      |
| `TextField`              | `id="undefined"` bila tanpa `id`/`name`/label; input 21px dan tombol hapus kurang dari 24px (WCAG 2.5.8)                    | selalu beri `id`; `min-height`/`min-width` 24px di `src/index.css`                                             |
| `PhoneInput`             | daftar negara berperan sebagai input ARIA tanpa nama (`aria-input-field-name`)                                              | **belum dapat diperbaiki** (tidak ada prop); hanya selector itu dikecualikan di `e2e/a11y.spec.ts`             |
| `PasswordInput`          | teks error `#f02d2d` di atas putih = 4,1:1 (butuh 4,5:1)                                                                    | override ke `negative-600` di `src/index.css`                                                                  |
| `Badge` (soft, brand)    | teks primary di atas primary-100 = 3,56:1 pada 12px                                                                         | override ke `primary-700` (8,1:1) di `src/index.css`                                                           |
| `Alert` (caution)        | judul dan ikon kuning (warning-500) di atas warning-100 kontrasnya sangat rendah                                            | override ke `warning-700` di `src/index.css`                                                                   |
| `Drawer`                 | di layar <= 640px menjadi bottom sheet; tanpa `role="dialog"`, dan fokus keyboard tidak masuk ke panel                      | menu mobile admin memakai panel lipat sendiri (`src/admin/AdminLayout.tsx`), seperti header publik             |
| `Alert`                  | sudah ber-`role="alert"`: jangan dibungkus elemen ber-role sama (dibacakan dua kali)                                        | dipakai apa adanya                                                                                             |
| `Modal`                  | memfokuskan wadah dialog sekitar 85 ms setelah dibuka, sehingga `autoFocus` di dalamnya tertimpa dan ketikan awal terpotong | `useDialogInitialFocus` memindahkan fokus ke isian pertama (atau "Batal" pada konfirmasi hapus) setelah 150 ms |
| `Chip`                   | chip yang aktif tidak diberi `aria-pressed`, jadi pembaca layar tidak tahu filter mana yang dipilih (WCAG 4.1.2)            | `FilterChips`: tombol toggle sendiri dengan kelas CSS `ina-chip` dan `aria-pressed`                            |
| `Card`                   | `mediaAlt=""` diganti alt "Card media", sehingga pembaca layar membacakannya di awal setiap tautan kartu                    | `ArticleCard` menulis markup Card IDDS sendiri dengan `alt=""` dan `loading="lazy"`                            |
| `SingleFileUpload`       | pratinjau memakai URL `blob:` yang diblokir CSP `img-src 'self'`                                                            | `ImageFileInput`: `<input type="file">` asli; pratinjau memakai URL hasil unggahan di server                   |
| Header (menu ▾)          | anatomi Header IDDS punya menu dengan submenu, tetapi tidak ada komponennya; `BasicDropdown` melanggar `nested-interactive` | `NavDropdown`: pola disclosure WAI-ARIA (tombol + daftar tautan), gaya panel mengikuti `.ina-action-dropdown`  |

Catatan: `Card` IDDS membungkus `title` dalam `<h3>` dan `description` dalam `<p>`. `ArticleCard` menulis markup itu langsung dengan kelas CSS `ina-card` (lihat tabel di atas).

### Editor artikel

- Toolbar mengikuti pola [WAI-ARIA Toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/): satu tab stop, panah kiri/kanan dan Home/End berpindah antar tombol, `aria-pressed` untuk format, dan tombol yang belum tersedia memakai `aria-disabled` (bukan `disabled`) agar tetap bisa difokus.
- Elemen yang bisa dibuat editor sama persis dengan yang diizinkan penyaring backend (`ArticleHtmlSanitizer`); HTML yang tersimpan selalu hasil saringan server.
- CSP melarang `<style>` sisipan, jadi TipTap dijalankan dengan `injectCSS: false` dan CSS ProseMirror yang dibutuhkan ada di `src/index.css`. Tipografi isi artikel memakai kelas `.article-body`, yang sama di editor dan di halaman detail artikel publik.
- Gambar wajib diberi teks alternatif. Tautan hanya `https://`, `mailto:`, atau path situs ini.

## Aset

- Gambar artikel di `public/images/articles/*.webp` berukuran **328×202 px**: resolusinya rendah dan akan tampak buram bila diperbesar (mis. di halaman detail pada layar retina). Ganti dengan gambar asli beresolusi lebih tinggi (disarankan ≥1200 px lebar) bila tersedia.
- `public/panrb.svg` sudah dioptimasi dengan svgo (presisi 3, ±51% lebih kecil saat transfer); versi asli ada di riwayat git.

## Data yang masih placeholder

- 36 artikel dan 3 kategori dari seeder backend (`../backend/database/seeders/data/placeholder-content.json`) masih placeholder; ganti lewat CMS.
- Angka statistik beranda dan deskripsi situs kini diatur Admin di **Pengaturan**, tetapi nilai bawaannya (`../backend/app/Support/SiteSettings.php`) masih placeholder; isi dengan data resmi.
- Tautan media sosial dan kontak di footer kosong sampai Admin mengisinya (URL resmi belum diketahui).
- Daftar layanan (menu Layanan dan `/layanan`) ada di `src/data/siteContent.ts` (`allServices`), bukan di CMS. **Survei Kepuasan** sudah disiapkan tetapi tersembunyi karena alamatnya belum ada: isi `url` entri `survei-kepuasan`, maka layanan itu tampil otomatis di menu dan halaman. Alamat empat layanan lain mengikuti repo referensi `aldinosauruss/portal-pemdi`; pastikan ke pemiliknya sebelum rilis.
