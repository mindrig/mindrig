import { Auth } from "@wrkspc/core/auth";

export namespace AuthMessage {
  //#region Server

  export type Server = ServerUpdate;

  export interface ServerUpdate {
    type: "auth-server-update";
    payload: Auth;
  }

  //#endregion

  //#region Client

  export type Client =
    | ClientClear
    | ClientVercelGatewaySet
    | ClientVercelGatewayRevalidate;

  export interface ClientClear {
    type: "auth-client-clear";
  }

  export interface ClientVercelGatewaySet {
    type: "auth-client-vercel-gateway-set";
    payload: string;
  }

  export interface ClientVercelGatewayRevalidate {
    type: "auth-client-vercel-gateway-revalidate";
  }

  //#endregion
}
