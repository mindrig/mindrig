import { createContext, useContext } from "react";
import { SetupManager } from "./Manager";

export namespace SetupContext {
  export interface Value {
    setup: SetupManager;
  }
}

export const SetupContext = createContext<SetupContext.Value | undefined>(
  undefined,
);

export function SetupProvider(
  props: React.PropsWithChildren<SetupManager.UseProps>,
) {
  const test = SetupManager.use(props);

  return (
    <SetupContext.Provider value={{ setup: test }}>
      {props.children}
    </SetupContext.Provider>
  );
}

export function useSetup(): SetupContext.Value {
  const value = useContext(SetupContext);
  if (!value) throw new Error("useSetup must be used within SetupProvider");
  return value;
}
