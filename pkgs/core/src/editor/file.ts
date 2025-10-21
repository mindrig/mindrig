import { Language } from "@wrkspc/core/lang";

export interface EditorFile extends EditorFile.Meta {
  content: string;
}

export namespace EditorFile {
  export type Path = string & { [pathBrand]: true };
  declare const pathBrand: unique symbol;

  export interface Meta {
    path: Path;
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

  export interface Selection {
    start: number;
    end: number;
  }

  export interface Ref {
    path: Path;
    selection?: EditorFile.Selection | undefined;
  }

  export function path(value: string): Path {
    return value as Path;
  }
}
