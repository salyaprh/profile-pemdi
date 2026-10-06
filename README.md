# PEMDI PANRB — Profil Pemerintah Digital

Situs profil PEMDI / PANRB (Pemerintah Digital) yang menampilkan karya dan inisiatif TDP. Dibangun dengan [INA Digital Design System (IDDS)](https://design.inadigital.go.id/) dan tema brand **PANRB**.

## Stack

- React 19 + TypeScript (strict) + Vite 5
- Tailwind CSS v4 dengan token IDDS (`@idds/styles`)
- [`@idds/react`](https://design.inadigital.go.id/getting-started/code/react/) untuk komponen, `@tabler/icons-react` untuk ikon
- Router kecil buatan sendiri berbasis History API (`src/lib/router.tsx`), tanpa dependency tambahan

## Menjalankan

Butuh Node.js 18 atau lebih baru.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check (tsc) + build produksi ke dist/
npm run preview  # pratinjau hasil build
```

## Rute

| Path | Halaman |
|---|---|
| `/` | Beranda |
| `/portfolio` | Daftar portofolio. Filter dan halaman tersimpan di URL: `?kategori=Layanan+Publik&halaman=2` |
| `/portfolio/:id` | Detail artikel + artikel terkait |
| `/contact` | Formulir "Hubungi kami" |
| lainnya | Halaman 404 |

## Struktur

```
src/
  main.tsx            entry: tema IDDS (setBrandTheme('panrb')) + ToastProvider
  App.tsx             pemetaan rute -> halaman
  index.css           Tailwind, token IDDS, skala tipografi IDDS
  components/         Header, Footer, SearchBar, ArticleCard, ButtonLink, EmptyState, Layout
  pages/              Home, Articles (portofolio), ArticleDetail, Contact, NotFound
  data/               articlesData.ts (data dummy + helper), siteContent.ts (menu, footer, statistik)
  lib/                router.tsx, validators.ts, format.ts
  services/           contact.ts (pengiriman formulir)
public/               panrb.svg, assets/articles/*
```

## Konfigurasi formulir kontak

Formulir **belum terhubung ke server**. Isi `VITE_CONTACT_ENDPOINT` (salin `.env.example` menjadi `.env.local`) dengan URL yang menerima `POST` JSON:

```json
{ "name": "", "email": "", "phone": "", "subject": "", "message": "" }
```

Selama variabel ini kosong, pengguna melihat pemberitahuan bahwa pesan belum dikirim (pesan tidak berpura-pura terkirim). Respons non-2xx atau kegagalan jaringan menampilkan pesan gagal.

## Deploy

Karena memakai routing sisi klien, server harus mengarahkan semua path ke `index.html` (SPA fallback), jika tidak refresh di `/portfolio` akan 404. Contoh:

- Netlify / Cloudflare Pages: file `public/_redirects` berisi `/* /index.html 200`
- Vercel: `vercel.json` -> `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- Nginx: `try_files $uri /index.html;`

## Acuan desain

Seluruh tampilan mengacu ke IDDS. Gunakan token, bukan warna hex langsung:

- Warna: `text-content-*`, `border-stroke-*`, `bg-background-*`, `primary-*` (merah PANRB), `guide-*` (biru informatif) — [Warna](https://design.inadigital.go.id/foundation/color/)
- Tipografi (Inter): utilitas `text-display-*`, `text-h1`..`text-h5`, `text-body*`, `text-caption*` yang didefinisikan di `src/index.css` — [Tipografi](https://design.inadigital.go.id/foundation/typography/)
- Pola yang dipakai: [Header](https://design.inadigital.go.id/pattern/header/guide/), [Footer](https://design.inadigital.go.id/pattern/footer/guide/), [Searchbar](https://design.inadigital.go.id/pattern/searchbar/guide/), [Blog Section](https://design.inadigital.go.id/pattern/blog-section/guide/), [Blog Post](https://design.inadigital.go.id/pattern/blog-post/guide/), [404 Section](https://design.inadigital.go.id/pattern/404-section/guide/), [Empty State](https://design.inadigital.go.id/pattern/empty-state/guide/)
- Aksesibilitas mengikuti [WCAG 2.2 AA](https://design.inadigital.go.id/foundation/accessibility/): tautan semantik, skip link, fokus terlihat, `aria-current`.

Catatan: `Card` IDDS sudah membungkus `title` dalam `<h3>` dan `description` dalam `<p>`, jadi isi keduanya dengan `<span>`.

## Data yang masih placeholder

- 36 artikel di `src/data/articlesData.ts` adalah data dummy; isi detail semua artikel masih memakai `placeholderContent` (isi `content` per artikel dari CMS/API).
- Angka statistik di beranda (`heroStats` di `src/data/siteContent.ts`) belum data resmi.
- Tautan media sosial di footer belum ada (URL resmi belum diketahui).
