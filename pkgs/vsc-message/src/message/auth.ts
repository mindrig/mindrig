export type VscMessageAuth =
  | VscMessageAuth.VercelGet
  | VscMessageAuth.VercelSet
  | VscMessageAuth.VercelClear
  | VscMessageAuth.VercelState
  | VscMessageAuth.PanelOpen;

export namespace VscMessageAuth {
  export interface VercelGet {
    type: "auth-vercel-gateway-get";
    payload?: undefined;
  }

  export interface VercelSet {
    type: "auth-vercel-gateway-set";
    payload: string;
  }

  export interface VercelClear {
    type: "auth-vercel-gateway-clear";
    payload?: undefined;
  }

  export interface VercelState {
    type: "auth-vercel-gateway-state";
    payload: {
      vercelGatewayKey: string | null;
    };
  }

  export interface PanelOpen {
    type: "auth-panel-open";
    payload?: undefined;
  }
}
