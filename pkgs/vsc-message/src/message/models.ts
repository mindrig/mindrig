import type { ModelDotdev, ModelGateway } from "@wrkspc/model";

export type VscMessageModels =
  | VscMessageModels.DevGet
  | VscMessageModels.DevResponse
  | VscMessageModels.DataGet
  | VscMessageModels.DataResponse;

export namespace VscMessageModels {
  export interface DevGet {
    type: "models-dev-get";
    payload?: undefined;
  }

  export interface DevResponse {
    type: "models-dev-response";
    payload: DevResponsePayload;
  }

  export interface DataGet {
    type: "models-data-get";
    payload?: undefined;
  }

  export interface DataResponse {
    type: "models-data-response";
    payload: DataResponsePayload;
  }


  export type DevResponsePayload =
    | DevResponsePayloadOk
    | DevResponsePayloadError;

  export interface DevResponsePayloadOk {
    status: "ok";
    data: ModelDotdev.Response;
  }

  export interface DevResponsePayloadError {
    status: "error";
    error: string;
  }

  export interface DataResponsePayload {
    gateway: ModelGateway.Response | undefined;
    dotDev: ModelDotdev.Response | undefined;
  }

}
