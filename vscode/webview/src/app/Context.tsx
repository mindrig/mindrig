import { SettingsProvider } from "@/aspects/settings/Context";
import { VscProvider } from "@/aspects/vsc/Context";
import React from "react";

export function Context(props: React.PropsWithChildren) {
  return (
    <VscProvider>
      <SettingsProvider>{props.children}</SettingsProvider>
    </VscProvider>
  );
}
