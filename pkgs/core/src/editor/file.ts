import { Language } from "@wrkspc/core/lang";
import { Versioned } from "../versioned";

export interface EditorFile extends EditorFile.Meta {
  content: string;
}

export namespace EditorFile {
  // TODO: Move it to "server" rather than editor as files can be outside of
  // the editor workspace as well as come from another backend source, i.e.
  // desktop app or remote server (not a case right now though).
  export type Path = string & { [pathBrand]: true };
  declare const pathBrand: unique symbol;

  export type Meta = MetaV1;

  export interface MetaV1 extends Versioned<1> {
    path: Path;
    isDirty: boolean;
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
}

export function editorFileToMeta(file: EditorFile): EditorFile.Meta {
  const { path, isDirty, languageId } = file;
  return { v: 1, path, isDirty, languageId };
}

export function areFileMetasEqual(
  left: EditorFile.Meta,
  right: EditorFile.Meta,
): boolean {
  return (
    left.path === right.path &&
    left.isDirty === right.isDirty &&
    left.languageId === right.languageId &&
    areFileCursorsEqual(left.cursor, right.cursor)
  );
}

export function areFileCursorsEqual(
  left: EditorFile.Cursor | undefined,
  right: EditorFile.Cursor | undefined,
): boolean {
  if (!left || !right) return left === right;
  return (
    left.offset === right.offset &&
    left.line === right.line &&
    left.character === right.character
  );
}
