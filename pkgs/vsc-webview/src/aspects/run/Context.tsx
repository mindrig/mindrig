import { createContext, useContext } from "react";
import { ResultsProvider } from "../result/ResultsContext";
import { RunManager } from "./Manager";

export namespace RunContext {
  export interface Value {
    run: RunManager;
  }
}

export const RunContext = createContext<RunContext.Value | undefined>(
  undefined,
);

export namespace RunProvider {
  export interface Props {
    run: RunManager;
  }
}

export function RunProvider(props: React.PropsWithChildren<RunContext.Value>) {
  const { run } = props;
  return (
    <RunContext.Provider value={{ run }}>
      <ResultsProvider runId={run.runId}>{props.children}</ResultsProvider>
    </RunContext.Provider>
  );
}

export function useRun(): RunContext.Value {
  const value = useContext(RunContext);
  if (!value) throw new Error("useRun must be used within RunProvider");
  return value;
}
