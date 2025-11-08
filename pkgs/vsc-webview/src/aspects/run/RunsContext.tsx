import { createContext, useContext } from "react";
import { RunsManager } from "./RunsManager";

export namespace RunsContext {
  export interface Value {
    runs: RunsManager;
  }
}

export const RunsContext = createContext<RunsContext.Value | undefined>(
  undefined,
);

export function RunsProvider(props: React.PropsWithChildren) {
  const runs = RunsManager.use();
  return (
    <RunsContext.Provider value={{ runs }}>
      {props.children}
    </RunsContext.Provider>
  );
}

export function useRuns(): RunsContext.Value {
  const value = useContext(RunsContext);
  if (!value) throw new Error("useRuns must be used within RunsProvider");
  return value;
}
