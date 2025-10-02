import type { SyncFile } from "@wrkspc/vsc-sync";

export type VscMessageFile =
  | VscMessageFile.ActiveChanged
  | VscMessageFile.ContentChanged
  | VscMessageFile.Saved
  | VscMessageFile.CursorChanged;

export namespace VscMessageFile {
  export type Type =
    | "file-active-changed"
    | "file-content-changed"
    | "file-saved"
    | "file-cursor-changed";

  export interface ActiveChanged {
    type: "file-active-changed";
    payload: SyncFile.State | null;
  }

  export interface ContentChanged {
    type: "file-content-changed";
    payload: SyncFile.State;
  }

  export interface Saved {
    type: "file-saved";
    payload: SyncFile.State;
  }

  export interface CursorChanged {
    type: "file-cursor-changed";
    payload: SyncFile.State;
  }
}
