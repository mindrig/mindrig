import { Attachment } from "../attachment/index.js";
import { ModelSettings } from "../model/settings.js";
import { PromptArguments } from "../prompt/index.js";
import type {
  PromptRunResultCompletedPayload,
  PromptRunResultData,
  PromptRunStartedPayload,
  PromptRunUpdatePayload,
  Run,
} from "./index.js";

export namespace RunMessage {
  //#region Server

  export type Server =
    | ServerTrigger
    | ServerStart
    | ServerUpdate
    | ServerResultComplete
    | ServerComplete
    | ServerError
    | ServerExecutionResult;

  export interface ServerTrigger {
    type: "run-server-trigger";
  }

  export interface ServerStart {
    type: "run-server-start";
    payload: PromptRunStartedPayload;
  }

  export interface ServerUpdate {
    type: "run-server-update";
    payload: PromptRunUpdatePayload;
  }

  export interface ServerResultComplete {
    type: "run-server-result-complete";
    payload: PromptRunResultCompletedPayload;
  }

  export interface ServerComplete {
    type: "run-server-complete";
    payload: ServerCompletePayload;
  }

  export interface ServerCompletePayload {
    runId: string;
    promptId: string;
    timestamp: number;
    success: boolean;
    results: PromptRunResultData[];
  }

  export interface ServerError {
    type: "run-server-error";
    payload: ServerErrorPayload;
  }

  export interface ServerErrorPayload {
    runId: string;
    resultId?: string;
    timestamp: number;
    promptId: string;
    error: string;
  }

  export interface ServerExecutionResult {
    type: "run-server-execution-result";
    payload: ServerExecutionResultPayload;
  }

  export interface ServerExecutionResultPayload {
    success: boolean;
    promptId: string;
    timestamp: number;
    runId: string;
    runSettings?: unknown;
    results: PromptRunResultData[];
    error?: string;
  }

  //#endregion

  //#region Client

  export type Client = ClientExecute | ClientStop;

  export interface ClientExecute {
    type: "run-client-execute";
    payload: ClientExecutePayload;
  }

  export interface ClientExecutePayload {
    promptText: string;
    variables: PromptArguments;
    promptId: string;
    streamingEnabled?: boolean;
    modelId?: string | null;
    // @ts-ignore
    runs?: Array<Run.Info>;
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

  export interface ClientStop {
    type: "run-vw-stop";
    payload: {
      runId: string;
    };
  }
}

//#endregion
