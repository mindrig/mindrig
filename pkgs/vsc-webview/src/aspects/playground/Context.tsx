import { PlaygroundState } from "@wrkspc/core/playground";
import { useMemo } from "react";
import { useClientState } from "../client/StateContext";

export namespace PlaygroundContext {
  export interface Value {
    playground: PlaygroundState;
  }
}

export function usePlayground(): PlaygroundContext.Value {
  const { state } = useClientState();
  const value = useMemo(
    () => ({ playground: state.playground }),
    [state.playground],
  );
  return value;
}
