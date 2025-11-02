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

  export type Client = ClientGatewayRefresh | ClientDotdevRefresh;

  export interface ClientGatewayRefresh {
    type: "models-client-gateway-refresh";
  }

  export interface ClientDotdevRefresh {
    type: "models-client-dotdev-refresh";
  }

  //#endregion
}
