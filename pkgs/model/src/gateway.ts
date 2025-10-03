import { ModelVercel } from "./vercel";

export namespace ModelGateway {
  export type Response = ResponseVercel;

  export interface ResponseVercel {
    type: "vercel";
    response: ResponseDataOk<ModelVercel.Data>;
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
