import type { ModelDotdev, ModelGateway } from "@wrkspc/core/model";

export namespace ModelsMessage {
  //#region Server

  export type Server = ServerGatewayResponse | ServerDotdevResponse;

  export interface ServerGatewayResponse {
    type: "models-server-gateway-response";
    payload: ModelGateway.ListResponse;
  }

  export interface ServerDotdevResponse {
    type: "models-server-dotdev-response";
    payload: ModelDotdev.ListResponse;
  }

  //#endregion

  //#region Client

  export type Client = WebviewGatewayRefresh | WebviewDotdevRefresh;

  export interface WebviewGatewayRefresh {
    type: "models-client-gateway-refresh";
  }

  export interface WebviewDotdevRefresh {
    type: "models-client-dotdev-refresh";
  }

  //#endregion
}
