import type { VscSettings } from "@wrkspc/vsc-types";

export type VscMessageSettings =
  | VscMessageSettings.StreamingGet
  | VscMessageSettings.StreamingSet
  | VscMessageSettings.StreamingState;

export namespace VscMessageSettings {
  //#region Extension

  export type Extension = ExtensionUpdate;

  export interface ExtensionUpdate {
    type: "settings-ext-update";
    payload: VscSettings;
  }

  //#endregion

  //#region Webview

  export type Webview = never;

  //#endregion

  //#region Legacy

  export interface StreamingGet {
    type: "settings-streaming-get";
    payload?: undefined;
  }

  export interface StreamingSet {
    type: "settings-streaming-set";
    payload: { enabled: boolean };
  }

  export interface StreamingState {
    type: "settings-streaming-state";
    payload: { enabled: boolean };
  }

  //#endregion
}
