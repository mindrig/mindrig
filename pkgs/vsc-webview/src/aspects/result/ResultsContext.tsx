import { State } from "enso";
import { createContext, useContext } from "react";
import { ResultsState } from "./state";

export namespace ResultsContext {
  export interface Value {
    // TODO: Kill manager?
    // manager: ResultsManager;
    state: State<ResultsState>;
  }
}

export const ResultsContext = createContext<ResultsContext.Value | undefined>(
  undefined,
);

export function ResultsProvider(
  props: React.PropsWithChildren<ResultsContext.Value>,
) {
  return (
    <ResultsContext.Provider value={props}>
      {props.children}
    </ResultsContext.Provider>
  );
}

export function useResults(): ResultsContext.Value {
  const value = useContext(ResultsContext);
  if (!value) throw new Error("useResults must be used within ResultsProvider");
  return value;
}
