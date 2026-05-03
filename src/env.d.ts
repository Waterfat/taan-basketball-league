/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SHEET_ID: string;
  readonly PUBLIC_SHEETS_API_KEY: string;
  readonly PUBLIC_SITE_URL: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
