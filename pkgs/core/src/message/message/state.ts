import { EditorState } from "src/editor";

export namespace VscMessageState {
  //#region Extension

  export type Extension = ExtensionStateUpdate;

  export interface ExtensionStateUpdate {
    type: "state-update";
    payload: EditorState;
  }

  //#endregion

  //#region Webview

  export type Webview = never;

  //#endregion
}
