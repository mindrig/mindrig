import { EditorFile } from "../editor";
import { FileContent, FileInfo } from "../file";
import { Versioned } from "../versioned";

export type Attachment = Attachment.V1;

export namespace Attachment {
  export interface V1 extends Versioned<1>, FileInfo {
    mime: string;
    size: number;
  }

  export interface Input {
    path: EditorFile.Path;
    base64: FileContent.Base64;
    mime: string;
  }
}
