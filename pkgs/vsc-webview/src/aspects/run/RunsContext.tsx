import { createContext, useContext } from "react";

export namespace RunsContext {
  export interface Value {}
}

export const RunsContext = createContext<RunsContext.Value | undefined>(
  undefined,
);

export namespace RunsProvider {
  export interface Props {}
}

export function RunsProvider(
  props: React.PropsWithChildren<RunsProvider.Props>,
) {
  const {} = props;
  return (
    <RunsContext.Provider value={{}}>{props.children}</RunsContext.Provider>
  );
}

export function useRuns(): RunsContext.Value {
  const value = useContext(RunsContext);
  if (!value) throw new Error("useRuns must be used within RunsProvider");
  return value;
}
