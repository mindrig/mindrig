import { Attachment as RootAttachment } from "../attachment/index.js";
import { FileContent } from "../file";
import { PromptArguments } from "../prompt";

export type Run = Run.V1;

export namespace Run {
  export interface V1 {}

  export interface Info {
    label: string;
    variables: PromptArguments;
    substitutedPrompt: string;
  }

  export type Id = string & { [idBrand]: true };
  declare const idBrand: unique symbol;

  export interface Attachment extends RootAttachment {
    base64: FileContent.Base64;
  }
}
