import { PromptParse } from "@/prompt";
import { Auth } from "../auth";
import { Settings } from "../settings";

export interface ClientState {
  auth: Auth;
  settings?: Settings | undefined;
  prompts: PromptParse.Result;
}

export namespace ClientState {
  export interface Prompt {
    selected: PromptSelected | null;
  }

  export interface PromptSelected {
    hash: string;
  }
}

export function defaultClientStatePrompt(): ClientState.Prompt {
  return {
    selected: null,
  };
}
