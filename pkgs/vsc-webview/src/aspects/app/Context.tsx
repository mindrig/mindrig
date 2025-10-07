import { AuthProvider } from "@/aspects/auth/Context";
import { MessagesProvider } from "@/aspects/message/Context";
import { ModelsProvider } from "@/aspects/model/Context";
import { SettingsProvider } from "@/aspects/settings/Context";
import { VscProvider } from "@/aspects/vsc/Context";
import React from "react";
import { PromptsProvider } from "../prompt/Context";

export function AppContext(props: React.PropsWithChildren) {
  return (
    <VscProvider>
      <MessagesProvider>
        <AuthProvider>
          <ModelsProvider>
            <SettingsProvider>
              <PromptsProvider>{props.children}</PromptsProvider>
            </SettingsProvider>
          </ModelsProvider>
        </AuthProvider>
      </MessagesProvider>
    </VscProvider>
  );
}
