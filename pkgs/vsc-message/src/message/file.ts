import type { SyncFile } from "@wrkspc/vsc-sync";

export type VscMessageFile =
  | VscMessageFile.ActiveChange
  | VscMessageFile.ContentChange
  | VscMessageFile.Save
  | VscMessageFile.CursorChange;

export namespace VscMessageFile {
  export interface ActiveChange {
    type: "file-active-change";
    payload: SyncFile.State | null;
  }

  export interface ContentChange {
    type: "file-content-change";
    payload: SyncFile.State;
  }

  export interface Save {
    type: "file-save";
    payload: SyncFile.State;
  }

  export interface CursorChange {
    type: "file-cursor-change";
    payload: SyncFile.State;
  }
}
