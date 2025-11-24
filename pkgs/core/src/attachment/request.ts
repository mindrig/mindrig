import { Model } from "@wrkspc/core/model";
import { nanoid } from "nanoid";

export namespace AttachmentRequest {
  export type Id = string & { [idBrand]: true };
  declare const idBrand: unique symbol;

  export type Modalities = Modality[];

  export type Modality = Model.TypeLanguageModalityInput;
}

export function buildAttachmentRequestId() {
  return `attachment-request-${nanoid()}` as AttachmentRequest.Id;
}
