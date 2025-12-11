import { PlaygroundState } from "@wrkspc/core/playground";
import { State } from "enso";
import { createContext, useContext } from "react";

export namespace BlueprintContext {
  export interface Value {
    promptState: State<PlaygroundState.Prompt>;
  }
}

export const BlueprintContext = createContext<
  BlueprintContext.Value | undefined
>(undefined);

export function BlueprintProvider(
  props: React.PropsWithChildren<BlueprintContext.Value>,
) {
  return (
    <BlueprintContext.Provider value={props}>
      {props.children}
    </BlueprintContext.Provider>
  );
}

export function useBlueprint(): BlueprintContext.Value {
  const value = useContext(BlueprintContext);
  if (!value)
    throw new Error("useBlueprint must be used within BlueprintProvider");
  return value;
}
