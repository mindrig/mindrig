/// <reference types="vite/client" />

import type { Vsc } from "@/aspects/vsc/api";
import type { VscState } from "@wrkspc/vsc-state";

declare global {
  interface Window {
    acquireVsCodeApi?: Vsc.AcquireApi;
    initialState?: VscState;
  }

  interface ViteTypeOptions {}

  interface ImportMetaEnv {
    readonly VITE_MINDRIG_GATEWAY_ORIGIN: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
