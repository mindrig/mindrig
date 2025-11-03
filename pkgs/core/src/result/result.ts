import { Prompt } from "@mindrig/types";
import { Attachment } from "../attachment";
import { ModelType } from "../model/type";
import { Setup } from "../setup";
import { Tool } from "../tool";

export type Result =
  | Result.ResultInitialized
  | Result.ResultRunning
  | Result.ResultError
  | Result.ResultComplete;

export namespace Result {
  export interface ResultBase<Status extends string> {
    status: Status;
    createdAt: number;
    init: Init;
  }

  export interface ResultInitialized extends ResultBase<"initialized"> {}

  export interface ResultBaseStarted<Status extends string>
    extends ResultBase<Status> {
    startedAt: number;
  }

  export interface ResultRunning extends ResultBaseStarted<"running"> {
    updatedAt: number;
    usage: Usage | null;
    payload: ModelType.Payload | null;
  }

  export interface ResultError extends ResultBaseStarted<"error"> {
    erroredAt: number;
    request: Request;
    response: Response | null;
    error: string;
    usage: Usage | null;
    payload: ModelType.Payload | null;
  }

  export interface ResultComplete extends ResultBaseStarted<"complete"> {
    completedAt: number;
    request: Request;
    response: Response;
    usage: Usage;
    payload: ModelType.Payload;
  }

  export type Layout = "vertical" | "horizontal" | "carousel";

  export interface Init {
    prompt: Prompt;
    setup: Setup;
    tools: Tool[];
    datasources: InitDatasource[];
    attachments: Attachment[];
    streaming: boolean;
  }

  export interface InitDatasource {}

  export interface Request {
    // TODO: Add details
    payload: object;
  }

  export interface Response {
    // TODO: Add details
    payload: object;
  }

  export interface Usage {
    input: number;
    output: number;
  }
}
