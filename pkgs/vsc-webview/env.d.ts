/// <reference types="vite/client" />

import type { Vsc } from "@/aspects/vsc/api";
import type { ClientState } from "@wrkspc/core/client";

declare global {
  interface Window {
    acquireVsCodeApi?: Vsc.AcquireApi;
    initialState?: ClientState;
  }

  interface ViteTypeOptions {}

  interface ImportMetaEnv {
    readonly VITE_MINDRIG_GATEWAY_ORIGIN: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
