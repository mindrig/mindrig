import type {
  PromptRunCompletedPayload,
  PromptRunErrorPayload,
  PromptRunResultCompletedPayload,
  PromptRunResultData,
  PromptRunResultShell,
  PromptRunStartedPayload,
  PromptRunUpdatePayload,
} from "@wrkspc/vsc-types";

export type VscMessagePromptRun =
  | VscMessagePromptRun.Execute
  | VscMessagePromptRun.Stop
  | VscMessagePromptRun.Start
  | VscMessagePromptRun.Update
  | VscMessagePromptRun.ResultComplete
  | VscMessagePromptRun.Complete
  | VscMessagePromptRun.Error
  | VscMessagePromptRun.ExecutionResult;

export namespace VscMessagePromptRun {
  export interface Execute {
    type: "prompt-run-execute";
    payload: ExecutePayload;
  }

  export interface Stop {
    type: "prompt-run-stop";
    payload: {
      runId: string;
    };
  }

  export interface Start {
    type: "prompt-run-start";
    payload: PromptRunStartedPayload;
  }

  export interface Update {
    type: "prompt-run-update";
    payload: PromptRunUpdatePayload;
  }

  export interface ResultComplete {
    type: "prompt-run-result-complete";
    payload: PromptRunResultCompletedPayload;
  }

  export interface Complete {
    type: "prompt-run-complete";
    payload: PromptRunCompletedPayload;
  }

  export interface Error {
    type: "prompt-run-error";
    payload: PromptRunErrorPayload;
  }

  export interface ExecutionResult {
    type: "prompt-run-execution-result";
    payload: ExecutionResultPayload;
  }

  export interface ExecutePayload {
    promptText: string;
    variables: Record<string, string>;
    promptId: string;
    streamingEnabled?: boolean;
    modelId?: string | null;
    runs?: Array<{
      label?: string;
      variables: Record<string, string>;
      substitutedPrompt: string;
    }>;
    models?: Array<{
      key: string;
      modelId: string | null;
      providerId?: string | null;
      label?: string | null;
      options?: Record<string, unknown>;
      tools?: unknown;
      providerOptions?: unknown;
      attachments?: Array<{ name: string; mime: string; dataBase64: string }>;
      reasoning?: {
        enabled: boolean;
        effort: "low" | "medium" | "high";
        budgetTokens?: number | "";
      };
    }>;
    options?: Record<string, unknown>;
    tools?: unknown;
    toolChoice?: unknown;
    providerOptions?: unknown;
    attachments?: Array<{ name: string; mime: string; dataBase64: string }>;
    runSettings?: Record<string, unknown>;
  }

  export interface ExecutionResultPayload {
    success: boolean;
    promptId: string;
    timestamp: number;
    runId: string;
    runSettings?: unknown;
    results: PromptRunResultData[];
    error?: string;
  }

  export interface ResultShell extends PromptRunResultShell {}
  export interface ResultData extends PromptRunResultData {}
}
