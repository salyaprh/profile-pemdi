/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL endpoint (POST JSON) penerima pesan dari halaman Hubungi kami. */
  readonly VITE_CONTACT_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
