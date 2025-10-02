import type { Prompt } from "@mindrig/types";

export type VscMessagePrompts =
  | VscMessagePrompts.Change
  | VscMessagePrompts.ExecuteFromCommand
  | VscMessagePrompts.Reveal;

export namespace VscMessagePrompts {
  export interface Change {
    type: "prompts-change";
    payload: {
      prompts: Prompt[];
      parseStatus?: "success" | "error";
      parseError?: unknown;
    };
  }

  export interface ExecuteFromCommand {
    type: "prompts-execute-from-command";
    payload?: undefined;
  }

  export interface Reveal {
    type: "prompts-reveal";
    payload: {
      file: string;
      selection: {
        start: number;
        end: number;
      };
    };
  }
}
