/// <reference types="vite/client" />

import type { Vsc } from "@/aspects/vsc/api";
import type { EditorState } from "@wrkspc/core/editor";

declare global {
  interface Window {
    acquireVsCodeApi?: Vsc.AcquireApi;
    initialState?: EditorState;
  }

  interface ViteTypeOptions {}

  interface ImportMetaEnv {
    readonly VITE_MINDRIG_GATEWAY_ORIGIN: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
