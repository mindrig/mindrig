import { Language } from "@wrkspc/lang";

export namespace SyncFile {
  export interface State {
    path: string;
    content: string;
    isDirty: boolean;
    lastSaved?: Date | undefined;
    languageId: Language.Id;
    cursor?: Cursor | undefined;
  }

  export interface Cursor {
    offset: number;
    line: number;
    character: number;
  }
}
