import { Auth } from "@wrkspc/core/auth";

export type VscMessageAuth = VscMessageAuth.ExtensionUpdate;

export namespace VscMessageAuth {
  //#region Extension

  export type Extension = ExtensionUpdate;

  export interface ExtensionUpdate {
    type: "auth-ext-update";
    payload: Auth;
  }

  //#endregion

  //#region Webview

  export type Webview =
    | WebviewLogout
    | WebviewVercelGatewaySet
    | WebviewVercelGatewayClear
    | WebviewVercelGatewayRevalidate;

  export interface WebviewLogout {
    type: "auth-wv-logout";
  }

  export interface WebviewVercelGatewaySet {
    type: "auth-wv-vercel-gateway-set";
    payload: string;
  }

  export interface WebviewVercelGatewayClear {
    type: "auth-wv-vercel-gateway-clear";
  }

  export interface WebviewVercelGatewayRevalidate {
    type: "auth-wv-vercel-gateway-revalidate";
  }

  //#endregion
}
