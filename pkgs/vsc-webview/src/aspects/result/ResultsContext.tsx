import { createContext, useContext } from "react";

export namespace ResultsContext {
  export interface Value {}
}

export const ResultsContext = createContext<ResultsContext.Value | undefined>(
  undefined,
);

export namespace ResultsProvider {
  export interface Props {}
}

export function ResultsProvider(
  props: React.PropsWithChildren<ResultsProvider.Props>,
) {
  const {} = props;
  return (
    <ResultsContext.Provider value={{}}>
      {props.children}
    </ResultsContext.Provider>
  );
}

export function useResults(): ResultsContext.Value {
  const value = useContext(ResultsContext);
  if (!value) throw new Error("useResults must be used within ResultsProvider");
  return value;
}
