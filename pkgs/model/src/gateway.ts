import { ModelResponse } from "./response";
import { ModelVercel } from "./vercel";

export namespace ModelGateway {
  export type Response = ResponseVercel;

  export interface ResponseVercel {
    type: "vercel";
    /** Indicates whether data came from a user-scoped call or the fallback wrapper. */
    source: Source;
    /** Epoch timestamp in milliseconds when the response was resolved. */
    fetchedAt: number;
    data: ResponseVercelData;
  }

  export type ResponseVercelData = ModelResponse.Data<ModelVercel.Payload>;

  export type Source = SourceAuth | SourceGlobal;

  export type SourceType = Source["type"];

  export interface SourceAuth {
    type: "auth";
    hash: string;
  }

  export interface SourceGlobal {
    type: "global";
  }
}
