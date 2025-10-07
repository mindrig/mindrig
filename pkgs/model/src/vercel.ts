import { GatewayLanguageModelEntry } from "@ai-sdk/gateway";

export namespace ModelVercel {
  export type ModelId = string & { [modelIdBrand]: true };
  declare const modelIdBrand: unique symbol;

  export type Model = Omit<GatewayLanguageModelEntry, "id"> & {
    /** Model id. */
    id: ModelId;
  };

  export interface Payload {
    models: Model[];
  }
}
