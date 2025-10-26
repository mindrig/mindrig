import { Settings } from "@wrkspc/core/settings";
import { useMemo } from "react";
import { useClientState } from "../client/StateContext";

export namespace SettingsContext {
  export interface Value {
    settings: Settings;
  }
}

export function useSettings(): SettingsContext.Value {
  const { state } = useClientState();
  const value = useMemo(
    () => ({ settings: state.settings || {} }),
    [state.settings],
  );
  return value;
}
