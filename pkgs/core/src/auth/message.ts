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
    | WebviewLogout
    | WebviewVercelGatewaySet
    | WebviewVercelGatewayClear
    | WebviewVercelGatewayRevalidate;

  export interface WebviewLogout {
    type: "auth-client-logout";
  }

  export interface WebviewVercelGatewaySet {
    type: "auth-client-vercel-gateway-set";
    payload: string;
  }

  export interface WebviewVercelGatewayClear {
    type: "auth-client-vercel-gateway-clear";
  }

  export interface WebviewVercelGatewayRevalidate {
    type: "auth-client-vercel-gateway-revalidate";
  }

  //#endregion
}
