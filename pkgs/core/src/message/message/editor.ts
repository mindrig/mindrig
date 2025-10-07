import { EditorFile } from "../../editor";

export type VscMessageEditor =
  | VscMessageEditor.ExtActiveChange
  | VscMessageEditor.ExtFileUpdate
  | VscMessageEditor.ExtFileSave
  | VscMessageEditor.ExtCursorChange;

export namespace VscMessageEditor {
  //#region Extension

  export type Extension =
    | ExtFileUpdate
    | ExtActiveChange
    | ExtFileSave
    | ExtCursorChange;

  export interface ExtFileUpdate {
    type: "editor-ext-file-update";
    payload: EditorFile;
  }

  export interface ExtActiveChange {
    type: "editor-ext-active-change";
    payload: EditorFile | null;
  }

  export interface ExtFileSave {
    type: "editor-ext-file-save";
    payload: EditorFile;
  }

  export interface ExtCursorChange {
    type: "editor-ext-cursor-update";
    payload: EditorFile;
  }

  //#endregion

  //#region Webview

  export type Webview = never;

  //#endregion
}
