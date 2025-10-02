import type { Prompt } from "@mindrig/types";

export type VscMessagePrompts =
  | VscMessagePrompts.Changed
  | VscMessagePrompts.ExecuteFromCommand
  | VscMessagePrompts.Reveal;

export namespace VscMessagePrompts {
  export type Type =
    | "prompts-changed"
    | "prompt-execute-from-command"
    | "prompt-reveal";

  export interface Changed {
    type: "prompts-changed";
    payload: {
      prompts: Prompt[];
      parseStatus?: "success" | "error";
      parseError?: unknown;
    };
  }

  export interface ExecuteFromCommand {
    type: "prompt-execute-from-command";
    payload?: undefined;
  }

  export interface Reveal {
    type: "prompt-reveal";
    payload: {
      file: string;
      selection: {
        start: number;
        end: number;
      };
    };
  }
}
