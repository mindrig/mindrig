import { useState } from "react";
import { useOn } from "@/aspects/message/messageContext";
import type { VscMessageAuth } from "@wrkspc/vsc-message";

export interface GatewaySecretState {
  maskedKey: string | null;
  hasKey: boolean;
  readOnly: boolean;
  isSaving: boolean;
  isResolved: boolean;
}

const INITIAL_STATE: GatewaySecretState = {
  maskedKey: null,
  hasKey: false,
  readOnly: false,
  isSaving: false,
  isResolved: false,
};

export function useGatewaySecretState(): GatewaySecretState {
  const [state, setState] = useState<GatewaySecretState>(INITIAL_STATE);

  useOn(
    "auth-vercel-gateway-state",
    (message: Extract<VscMessageAuth, { type: "auth-vercel-gateway-state" }>) => {
      setState({
        maskedKey: message.payload.maskedKey ?? null,
        hasKey: message.payload.hasKey,
        readOnly: message.payload.readOnly,
        isSaving: message.payload.isSaving,
        isResolved: true,
      });
    },
    [],
  );

  return state;
}
