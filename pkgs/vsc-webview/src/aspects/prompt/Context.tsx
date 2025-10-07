import { ClientState, defaultClientStatePrompt } from "@wrkspc/core/client";
import { PromptParse, promptParseResultPlaceholder } from "@wrkspc/core/prompt";
import React, { createContext, useContext, useState } from "react";
import { useListenMessage } from "../message/Context";

export namespace PromptsContext {
  export interface Value {
    parsed: PromptParse.Result;
    state: ClientState.Prompt;
  }
}

const PromptsContext = createContext<PromptsContext.Value | undefined>(
  undefined,
);

export function PromptsProvider(props: React.PropsWithChildren) {
  const [parsed, setParsed] = useState<PromptParse.Result>(
    window.initialState?.prompts || promptParseResultPlaceholder(),
  );
  const [state, setState] = useState<ClientState.Prompt>(
    defaultClientStatePrompt(),
  );

  useListenMessage(
    "prompt-ext-update",
    (message) => setParsed(message.payload),
    [setParsed],
  );

  return (
    <PromptsContext.Provider value={{ parsed, state }}>
      {props.children}
    </PromptsContext.Provider>
  );
}

export function usePrompts(): PromptsContext.Value {
  const value = useContext(PromptsContext);
  if (!value)
    throw new Error("usePrompts must be used within a PromptsProvider");
  return value;
}
