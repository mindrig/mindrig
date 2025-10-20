import { Attachment } from "../../attachment/index.js";
import { ModelSettings } from "../../model/settings.js";
import { PromptArguments } from "../../prompt/index.js";
import type {
  PromptRun,
  PromptRunResultCompletedPayload,
  PromptRunResultData,
  PromptRunStartedPayload,
  PromptRunUpdatePayload,
} from "../../promptRun/index.js";

export type VscMessagePromptRun =
  | VscMessagePromptRun.WvExecute
  | VscMessagePromptRun.WvStop
  | VscMessagePromptRun.ExtStart
  | VscMessagePromptRun.ExtUpdate
  | VscMessagePromptRun.ExtResultComplete
  | VscMessagePromptRun.ExtComplete
  | VscMessagePromptRun.ExtError
  | VscMessagePromptRun.ExtExecutionResult;

export namespace VscMessagePromptRun {
  //#region Extension

  export type Extension =
    | ExtTrigger
    | ExtStart
    | ExtUpdate
    | ExtResultComplete
    | ExtComplete
    | ExtError
    | ExtExecutionResult;

  export interface ExtTrigger {
    type: "prompt-run-ext-trigger";
  }

  export interface ExtStart {
    type: "prompt-run-ext-start";
    payload: PromptRunStartedPayload;
  }

  export interface ExtUpdate {
    type: "prompt-run-ext-update";
    payload: PromptRunUpdatePayload;
  }

  export interface ExtResultComplete {
    type: "prompt-run-ext-result-complete";
    payload: PromptRunResultCompletedPayload;
  }

  export interface ExtComplete {
    type: "prompt-run-ext-complete";
    payload: ExtCompletePayload;
  }

  export interface ExtCompletePayload {
    runId: string;
    promptId: string;
    timestamp: number;
    success: boolean;
    results: PromptRunResultData[];
  }

  export interface ExtError {
    type: "prompt-run-ext-error";
    payload: ExtErrorPayload;
  }

  export interface ExtErrorPayload {
    runId: string;
    resultId?: string;
    timestamp: number;
    promptId: string;
    error: string;
  }

  export interface ExtExecutionResult {
    type: "prompt-run-ext-execution-result";
    payload: ExtExecutionResultPayload;
  }

  export interface ExtExecutionResultPayload {
    success: boolean;
    promptId: string;
    timestamp: number;
    runId: string;
    runSettings?: unknown;
    results: PromptRunResultData[];
    error?: string;
  }

  //#endregion

  //#region Webview

  export type Webview = WvExecute | WvStop;

  export interface WvExecute {
    type: "prompt-run-wv-execute";
    payload: WvExecutePayload;
  }

  export interface WvExecutePayload {
    promptText: string;
    variables: PromptArguments;
    promptId: string;
    streamingEnabled?: boolean;
    modelId?: string | null;
    runs?: Array<PromptRun.Info>;
    models?: Array<{
      key: string;
      modelId: string | null;
      providerId?: string | null;
      label?: string | null;
      options?: Record<string, unknown>;
      tools?: unknown;
      providerOptions?: unknown;
      attachments?: Attachment[];
      reasoning?: ModelSettings.Reasoning;
    }>;
    options?: Record<string, unknown>;
    tools?: unknown;
    toolChoice?: unknown;
    providerOptions?: unknown;
    attachments?: Attachment[];
    runSettings?: Record<string, unknown>;
  }

  export interface WvStop {
    type: "prompt-run-vw-stop";
    payload: {
      runId: string;
    };
  }
}

//#endregion
