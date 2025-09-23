/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENVIRONMENT: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_SSO: string;
  readonly VITE_ENABLE_PWA: string;
  readonly VITE_SESSION_TIMEOUT: string;
  readonly VITE_SURVEY_AUTO_SAVE_INTERVAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}