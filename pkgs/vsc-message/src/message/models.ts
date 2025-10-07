import type { ModelDotdev, ModelGateway } from "@wrkspc/model";

export type VscMessageModels =
  | VscMessageModels.DevGet
  | VscMessageModels.DevResponse
  | VscMessageModels.DataGet
  | VscMessageModels.DataResponse;

export namespace VscMessageModels {
  //#region Extension

  export type Extension = ExtensionGatewayResponse | ExtensionDotdevResponse;

  export interface ExtensionGatewayResponse {
    type: "models-ext-gateway-response";
    payload: ModelGateway.Response;
  }

  export interface ExtensionDotdevResponse {
    type: "models-ext-dotdev-response";
    payload: ModelDotdev.Response;
  }

  //#endregion

  //#region Webview

  export type Webview = WebviewGatewayRefresh | WebviewDotdevRefresh;

  export interface WebviewGatewayRefresh {
    type: "models-wv-gateway-refresh";
  }

  export interface WebviewDotdevRefresh {
    type: "models-wv-dotdev-refresh";
  }

  //#endregion

  //#region Legacy

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
    data: ModelDotdev.ResponseData;
  }

  export interface DevResponsePayloadError {
    status: "error";
    error: string;
  }

  export interface DataResponsePayload {
    gateway: ModelGateway.Response | undefined;
    dotDev: ModelDotdev.ResponseData | undefined;
  }

  //#endregion
}
