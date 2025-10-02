import { MessageProvider } from "@/aspects/message/messageContext";
import { ModelsDevProvider } from "@/aspects/models-dev/Context";
import { SettingsProvider } from "@/aspects/settings/Context";
import { VscProvider } from "@/aspects/vsc/Context";
import React from "react";

export function Context(props: React.PropsWithChildren) {
  return (
    <VscProvider>
      <MessageProvider>
        <ModelsDevProvider>
          <SettingsProvider>{props.children}</SettingsProvider>
        </ModelsDevProvider>
      </MessageProvider>
    </VscProvider>
  );
}
