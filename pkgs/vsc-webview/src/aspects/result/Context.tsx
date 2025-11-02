import { createContext, useContext } from "react";

export namespace ResultContext {
  export interface Value {}
}

export const ResultContext = createContext<ResultContext.Value | undefined>(
  undefined,
);

export namespace ResultProvider {
  export interface Props {}
}

export function ResultProvider(
  props: React.PropsWithChildren<ResultProvider.Props>,
) {
  const {} = props;
  return (
    <ResultContext.Provider value={{}}>{props.children}</ResultContext.Provider>
  );
}

export function useResult(): ResultContext.Value {
  const value = useContext(ResultContext);
  if (!value) throw new Error("useResult must be used within RunProvider");
  return value;
}
