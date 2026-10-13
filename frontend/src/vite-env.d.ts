/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL endpoint (POST JSON) penerima pesan dari halaman Hubungi kami. */
  readonly VITE_CONTACT_ENDPOINT?: string;
  /** URL produksi tanpa path (mis. https://pemdi.panrb.go.id); dipakai untuk canonical, og:url, dan sitemap. */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
