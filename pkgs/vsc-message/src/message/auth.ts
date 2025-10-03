export type VscMessageAuth =
  | VscMessageAuth.VercelGet
  | VscMessageAuth.VercelSet
  | VscMessageAuth.VercelClear
  | VscMessageAuth.VercelState
  | VscMessageAuth.VercelStatus
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
}
