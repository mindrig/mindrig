import { VscWebviewState } from "@wrkspc/vsc-types";

export namespace VscMessageState {
  //#region Extension

  export type Extension = ExtensionStateUpdate;

  export interface ExtensionStateUpdate {
    type: "state-update";
    payload: VscWebviewState;
  }

  //#endregion

  //#region Webview

  export type Webview = never;

  //#endregion
}
