import { createContext, useContext } from "react";
import { BlueprintManager } from "./Manager";

export namespace BlueprintContext {
  export interface Value {
    manager: BlueprintManager;
  }
}

export const BlueprintContext = createContext<
  BlueprintContext.Value | undefined
>(undefined);

export namespace BlueprintProvider {
  export interface Props {
    manager: BlueprintManager;
  }
}

export function BlueprintProvider(
  props: React.PropsWithChildren<BlueprintProvider.Props>,
) {
  const { manager } = props;
  return (
    <BlueprintContext.Provider value={{ manager }}>
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
