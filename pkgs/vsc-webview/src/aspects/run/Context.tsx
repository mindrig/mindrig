import { createContext, useContext } from "react";

export namespace RunContext {
  export interface Value {}
}

export const RunContext = createContext<RunContext.Value | undefined>(
  undefined,
);

export namespace RunProvider {
  export interface Props {
    // manager: AssessmentManager;
  }
}

export function RunProvider(props: React.PropsWithChildren<RunProvider.Props>) {
  const {} = props;
  return <RunContext.Provider value={{}}>{props.children}</RunContext.Provider>;
}

export function useRun(): RunContext.Value {
  const value = useContext(RunContext);
  if (!value) throw new Error("useRun must be used within RunProvider");
  return value;
}
