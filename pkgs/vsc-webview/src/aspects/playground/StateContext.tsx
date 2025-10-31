import { PlaygroundState } from "@wrkspc/core/playground";
import { useMemo } from "react";
import { useClientState } from "../client/StateContext";

export namespace PlaygroundStateContext {
  export interface Value {
    playground: PlaygroundState;
  }
}

export function usePlaygroundState(): PlaygroundState {
  const { state } = useClientState();
  const value = useMemo(() => state.playground, [state.playground]);
  return value;
}
