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
    | ClientLogout
    | ClientVercelGatewaySet
    | ClientVercelGatewayClear
    | ClientVercelGatewayRevalidate;

  export interface ClientLogout {
    type: "auth-client-logout";
  }

  export interface ClientVercelGatewaySet {
    type: "auth-client-vercel-gateway-set";
    payload: string;
  }

  export interface ClientVercelGatewayClear {
    type: "auth-client-vercel-gateway-clear";
  }

  export interface ClientVercelGatewayRevalidate {
    type: "auth-client-vercel-gateway-revalidate";
  }

  //#endregion
}
