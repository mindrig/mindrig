import { VscSettings } from "@wrkspc/vsc-settings";
import { createContext, useContext, useState } from "react";
import { useOn } from "@/aspects/message/messageContext";

export namespace SettingsContext {
  export interface Value {
    settings: VscSettings;
  }
}

export const SettingsContext = createContext<SettingsContext.Value | undefined>(
  undefined,
);

export function SettingsProvider(props: React.PropsWithChildren) {
  const [settings, setSettings] = useState<VscSettings>(
    window.initialState?.settings || {},
  );

  useOn(
    "settings-update",
    (message) => {
      setSettings(message.payload);
    },
    [setSettings],
  );

  return (
    <SettingsContext.Provider value={{ settings }}>
      {props.children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContext.Value {
  const value = useContext(SettingsContext);
  if (!value)
    throw new Error("useSettings must be used within a SettingsProvider");
  return value;
}
