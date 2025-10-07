import { PromptArguments } from "../prompt";

export interface PromptRun {}

export namespace PromptRun {
  export interface Info {
    label: string;
    variables: PromptArguments;
    substitutedPrompt: string;
  }
}
