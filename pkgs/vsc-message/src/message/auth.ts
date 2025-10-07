import { Auth } from "@wrkspc/auth";

export type VscMessageAuth =
  | VscMessageAuth.ExtensionUpdate
  | VscMessageAuth.VercelGet
  | VscMessageAuth.VercelSet
  | VscMessageAuth.VercelClear
  | VscMessageAuth.VercelState
  | VscMessageAuth.VercelStatus
  | VscMessageAuth.PanelOpen;

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
    | WebviewVercelGatewayClear;

  export interface WebviewLogout {
    type: "auth-wv-logout";
  }

  export interface WebviewVercelGatewaySet {
    type: "auth-ext-vercel-gateway-set";
    payload: string;
  }

  export interface WebviewVercelGatewayClear {
    type: "auth-ext-vercel-gateway-clear";
  }

  //#endregion

  //#region Legacy

  // TODO: Remove legacy messages

  export interface VercelGet {
    type: "auth-vercel-gateway-get";
    payload?: undefined;
  }

  export interface VercelSet {
    type: "auth-ext-vercel-gateway-set";
    payload: string;
  }

  export interface VercelClear {
    type: "auth-ext-vercel-gateway-clear";
    payload?: undefined;
  }

  export interface VercelState {
    type: "auth-vercel-gateway-state";
    payload: {
      maskedKey: string | null;
      hasKey: boolean;
      readOnly: boolean;
      isSaving: boolean;
    };
  }

  export interface VercelStatus {
    type: "auth-vercel-gateway-status";
    payload: {
      status: "idle" | "ok" | "error";
      message?: string;
      checkedAt?: number;
      source: "user" | "fallback";
      fallbackUsed: boolean;
      userAttempted: boolean;
    };
  }

  export interface PanelOpen {
    type: "auth-panel-open";
    payload?: undefined;
  }

  //#endregion
}
