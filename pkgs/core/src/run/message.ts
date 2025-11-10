import type { Run } from "./index.js";

export namespace RunMessage {
  //#region Server

  export type Server = ServerTrigger | ServerError;
  // | ServerStart
  // | ServerUpdate
  // | ServerResultComplete
  // | ServerComplete
  // | ServerExecutionResult;

  export interface ServerTrigger {
    type: "run-server-trigger";
  }

  export interface ServerError {
    type: "run-server-error";
    payload: Run.Patch<"error">;
  }

  // export interface ServerStart {
  //   type: "run-server-start";
  //   payload: PromptRunStartedPayload;
  // }

  // export interface ServerUpdate {
  //   type: "run-server-update";
  //   payload: PromptRunUpdatePayload;
  // }

  // export interface ServerResultComplete {
  //   type: "run-server-result-complete";
  //   payload: PromptRunResultCompletedPayload;
  // }

  // export interface ServerComplete {
  //   type: "run-server-complete";
  //   payload: ServerCompletePayload;
  // }

  // export interface ServerCompletePayload {
  //   runId: string;
  //   promptId: string;
  //   timestamp: number;
  //   success: boolean;
  //   results: PromptRunResultData[];
  // }

  // export interface ServerError {
  //   type: "run-server-error";
  //   payload: ServerErrorPayload;
  // }

  // export interface ServerErrorPayload {
  //   runId: string;
  //   resultId?: string;
  //   timestamp: number;
  //   promptId: string;
  //   error: string;
  // }

  // export interface ServerExecutionResult {
  //   type: "run-server-execution-result";
  //   payload: ServerExecutionResultPayload;
  // }

  // export interface ServerExecutionResultPayload {
  //   success: boolean;
  //   promptId: string;
  //   timestamp: number;
  //   runId: string;
  //   runSettings?: unknown;
  //   results: PromptRunResultData[];
  //   error?: string;
  // }

  //#endregion

  //#region Client

  export type Client = ClientStart | ClientStop;

  export interface ClientStart {
    type: "run-client-start";
    payload: Run.Initialized;
  }

  export interface ClientStop {
    type: "run-client-stop";
    payload: {
      runId: Run.Id;
    };
  }
}

//#endregion
