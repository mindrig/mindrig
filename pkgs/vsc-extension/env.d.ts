/// <reference types="vite/client" />

declare global {
  interface ViteTypeOptions {}

  interface ImportMetaEnv {
    readonly VITE_MINDRIG_GATEWAY_ORIGIN: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
