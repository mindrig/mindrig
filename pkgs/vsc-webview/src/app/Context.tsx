import { AuthProvider } from "@/aspects/auth/Context";
import { MessagesProvider } from "@/aspects/message/Context";
import { ModelsProvider } from "@/aspects/models/Context";
import { SettingsProvider } from "@/aspects/settings/Context";
import { VscProvider } from "@/aspects/vsc/Context";
import React from "react";

export function Context(props: React.PropsWithChildren) {
  return (
    <VscProvider>
      <MessagesProvider>
        <AuthProvider>
          <ModelsProvider>
            <SettingsProvider>{props.children}</SettingsProvider>
          </ModelsProvider>
        </AuthProvider>
      </MessagesProvider>
    </VscProvider>
  );
}
