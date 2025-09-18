import { VscSettings } from "@wrkspc/vsc-settings";
import { createContext, useContext, useEffect, useState } from "react";
import { useVsc } from "../vsc/Context";

export namespace SettingsContext {
  export interface Value {
    settings: VscSettings;
  }
}

export const SettingsContext = createContext<SettingsContext.Value | undefined>(
  undefined,
);

export function SettingsProvider(props: React.PropsWithChildren) {
  const { vsc } = useVsc();
  const [settings, setSettings] = useState<VscSettings>(
    window.initialState?.settings || {},
  );

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (message.type !== "settingsUpdated") return;
      const settings = message.payload as VscSettings;
      setSettings(settings);
    };

    window.addEventListener("message", messageHandler);
    return () => window.removeEventListener("message", messageHandler);
  }, [vsc]);

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
