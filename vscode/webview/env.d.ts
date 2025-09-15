/// <reference types="vite/client" />

import type { Vsc } from "@/aspects/vsc";

declare global {
  interface Window {
    acquireVsCodeApi?: Vsc.AcquireApi;
  }

  interface ViteTypeOptions {}

  interface ImportMetaEnv {
    readonly VITE_MINDRIG_GATEWAY_ORIGIN: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
