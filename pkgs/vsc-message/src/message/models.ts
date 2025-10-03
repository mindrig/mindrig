import type { ModelDotdev } from "@wrkspc/model";

export type VscMessageModels =
  | VscMessageModels.DevGet
  | VscMessageModels.DevResponse;

export namespace VscMessageModels {
  export interface DevGet {
    type: "models-dev-get";
    payload?: undefined;
  }

  export interface DevResponse {
    type: "models-dev-response";
    payload: DevResponsePayload;
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
}
