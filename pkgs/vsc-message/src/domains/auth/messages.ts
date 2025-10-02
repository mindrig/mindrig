export type VscMessageAuth =
  | VscMessageAuth.GetVercelGatewayKey
  | VscMessageAuth.SetVercelGatewayKey
  | VscMessageAuth.ClearVercelGatewayKey
  | VscMessageAuth.VercelGatewayKeyChanged
  | VscMessageAuth.OpenVercelGatewayPanel;

export namespace VscMessageAuth {
  export type Type =
    | "auth-vercel-key-get"
    | "auth-vercel-key-set"
    | "auth-vercel-key-clear"
    | "auth-vercel-key-state"
    | "auth-vercel-panel-open";

  export interface GetVercelGatewayKey {
    type: "auth-vercel-key-get";
    payload?: undefined;
  }

  export interface SetVercelGatewayKey {
    type: "auth-vercel-key-set";
    payload: string;
  }

  export interface ClearVercelGatewayKey {
    type: "auth-vercel-key-clear";
    payload?: undefined;
  }

  export interface VercelGatewayKeyChanged {
    type: "auth-vercel-key-state";
    payload: {
      vercelGatewayKey: string | null;
    };
  }

  export interface OpenVercelGatewayPanel {
    type: "auth-vercel-panel-open";
    payload?: undefined;
  }
}
