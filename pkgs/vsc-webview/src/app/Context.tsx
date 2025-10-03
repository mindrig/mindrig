import { MessageProvider } from "@/aspects/message/messageContext";
import { ModelsProvider } from "@/aspects/models/Context";
import { SettingsProvider } from "@/aspects/settings/Context";
import { VscProvider } from "@/aspects/vsc/Context";
import React from "react";

export function Context(props: React.PropsWithChildren) {
  return (
    <VscProvider>
      <MessageProvider>
        <ModelsProvider>
          <SettingsProvider>{props.children}</SettingsProvider>
        </ModelsProvider>
      </MessageProvider>
    </VscProvider>
  );
}
