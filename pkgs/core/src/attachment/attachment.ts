import { FileContent } from "../file";
import { Versioned } from "../versioned";

export type Attachment = Attachment.V1;

export namespace Attachment {
  export type Path = string & { [pathBrand]: true };
  declare const pathBrand: unique symbol;

  export interface V1 extends Versioned<1> {
    path: Attachment.Path;
    name: string;
    mime: string;
  }

  export interface Input {
    path: Attachment.Path;
    base64: FileContent.Base64;
  }
}
