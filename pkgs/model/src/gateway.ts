import { ModelVercel } from "./vercel";

export namespace ModelGateway {
  export type Response = ResponseVercel;

  export type ResponseVercel = ResponseVercelOk | ResponseVercelError;

  export interface ResponseVercelBase {
    type: "vercel";
    /** Indicates whether data came from a user-scoped call or the fallback wrapper. */
    source: "user" | "fallback";
    /** Epoch timestamp in milliseconds when the response was resolved. */
    fetchedAt: number;
  }

  export interface ResponseVercelOk extends ResponseVercelBase {
    response: ResponseDataOk<ModelVercel.Data>;
  }

  export interface ResponseVercelError extends ResponseVercelBase {
    response: ResponseDataError;
  }

  export interface ResponseDataOk<Data> {
    status: "ok";
    data: Data;
  }

  export interface ResponseDataError {
    status: "error";
    message: string;
  }
}
