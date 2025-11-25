import { createContext, useContext } from "react";
import { CsvsManager } from "./CsvsManager";

export namespace CsvsContext {
  export interface Value {
    csvs: CsvsManager;
  }
}

export const CsvsContext = createContext<CsvsContext.Value | undefined>(
  undefined,
);

export function CsvsProvider(props: React.PropsWithChildren) {
  const files = CsvsManager.use();
  return (
    <CsvsContext.Provider value={{ csvs: files }}>
      {props.children}
    </CsvsContext.Provider>
  );
}

export function useCsvs(): CsvsContext.Value {
  const value = useContext(CsvsContext);
  if (!value) throw new Error("useCsvs must be used within CsvsProvider");
  return value;
}
