/// <reference types="vite/client" />

import type { Vsc } from "@/aspects/vsc/api";
import type { VscWebviewState } from "@wrkspc/vsc-types";

declare global {
  interface Window {
    acquireVsCodeApi?: Vsc.AcquireApi;
    initialState?: VscWebviewState;
  }

  interface ViteTypeOptions {}

  interface ImportMetaEnv {
    readonly VITE_MINDRIG_GATEWAY_ORIGIN: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
