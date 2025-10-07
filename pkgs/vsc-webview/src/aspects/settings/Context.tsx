import { useListenMessage } from "@/aspects/message/Context";
import { Settings } from "@wrkspc/core/settings";
import { createContext, useContext, useState } from "react";

export namespace SettingsContext {
  export interface Value {
    settings: Settings;
  }
}

export const SettingsContext = createContext<SettingsContext.Value | undefined>(
  undefined,
);

export function SettingsProvider(props: React.PropsWithChildren) {
  const [settings, setSettings] = useState<Settings>(
    window.initialState?.settings || {},
  );

  useListenMessage(
    "settings-ext-update",
    (message) => setSettings(message.payload),
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
