import { Run } from "@wrkspc/core/run";
import { createContext, useContext } from "react";
import { ResultsManager } from "./ResultsManager";

export namespace ResultsContext {
  export interface Value {
    results: ResultsManager;
  }
}

export const ResultsContext = createContext<ResultsContext.Value | undefined>(
  undefined,
);

export namespace ResultsProvider {
  export interface Props {
    runId: Run.Id;
  }
}

export function ResultsProvider(
  props: React.PropsWithChildren<ResultsProvider.Props>,
) {
  const { runId } = props;
  const results = ResultsManager.use(runId);

  return (
    <ResultsContext.Provider value={{ results }}>
      {props.children}
    </ResultsContext.Provider>
  );
}

export function useResults(): ResultsContext.Value {
  const value = useContext(ResultsContext);
  if (!value) throw new Error("useResults must be used within ResultsProvider");
  return value;
}
