import { Model } from "@wrkspc/core/model";

export namespace AttachmentRequest {
  export type Id = string & { [idBrand]: true };
  declare const idBrand: unique symbol;

  export type Modalities = Modality[];

  export type Modality = Model.TypeLanguageModalityInput;
}
