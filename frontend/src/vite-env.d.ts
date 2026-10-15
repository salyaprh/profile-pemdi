/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL produksi tanpa path (mis. https://pemdi.panrb.go.id); dipakai untuk canonical, og:url, dan robots.txt. */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
