import { Language } from "@wrkspc/core/lang";

export interface EditorFile {
  path: string;
  content: string;
  isDirty: boolean;
  lastSaved?: Date | undefined;
  languageId: Language.Id;
  cursor?: EditorFile.Cursor | undefined;
}

export namespace EditorFile {
  export interface Cursor {
    offset: number;
    line: number;
    character: number;
  }

  export interface Selection {
    start: number;
    end: number;
  }

  export interface Ref {
    path: string;
    selection?: EditorFile.Selection | undefined;
  }
}
