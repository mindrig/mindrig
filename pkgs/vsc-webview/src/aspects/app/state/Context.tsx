import { useVsc } from "@/aspects/vsc/Context";
import { State } from "enso";
import { createContext, useContext, useMemo } from "react";
import { AppState, buildAppState } from "./state";

export namespace AppStateContext {
  export interface Value {
    appState: State<AppState>;
  }
}

export const AppStateContext = createContext<AppStateContext.Value | undefined>(
  undefined,
);

export function AppStateProvider(props: React.PropsWithChildren) {
  const { vsc } = useVsc();

  const initialStore = useMemo<AppState>(
    () => Object.assign(buildAppState(), vsc.getState()),
    [vsc],
  );
  const appState = State.use(initialStore, [initialStore]);

  appState.useWatch((nextState) => vsc.setState(nextState), [vsc]);

  const value = useMemo(() => ({ appState }), [appState]);

  return (
    <AppStateContext.Provider value={value}>
      {props.children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value)
    throw new Error("useAppState must be used within AppStateProvider");
  return value;
}
