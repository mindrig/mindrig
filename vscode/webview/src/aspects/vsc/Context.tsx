import { createContext, useContext, useMemo } from "react";
import { Vsc } from ".";

export namespace VscContext {
  export interface Value {
    vsc: Vsc.Api;
  }
}

export const VscContext = createContext<VscContext.Value | undefined>(
  undefined,
);

export function VscProvider(props: React.PropsWithChildren) {
  const vsc = useMemo(() => window.acquireVsCodeApi?.(), []);
  if (!vsc) return null;
  return (
    <VscContext.Provider value={{ vsc }}>{props.children}</VscContext.Provider>
  );
}

export function useVsc(): VscContext.Value {
  const value = useContext(VscContext);
  if (!value) throw new Error("useVsc must be used within a VscProvider");
  return value;
}
