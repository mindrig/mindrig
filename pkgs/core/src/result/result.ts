import { nanoid } from "nanoid";
import { Attachment } from "../attachment";
import { Datasource } from "../datasource";
import { ModelUsage } from "../model";
import { ModelType } from "../model/type";
import { Setup } from "../setup";

export type Result =
  | Result.Initialized
  | Result.Running
  | Result.Errored
  | Result.Cancelled
  | Result.Success;

export namespace Result {
  export type Id = string & { [idBrand]: true };
  declare const idBrand: unique symbol;

  export type Status = Result["status"];

  export interface Base<Status extends string> {
    id: Id;
    status: Status;
    createdAt: number;
    init: Init;
  }

  export interface Initialized extends Base<"initialized"> {}

  export interface BaseStarted<Status extends string> extends Base<Status> {
    startedAt: number;
  }

  export interface Running extends BaseStarted<"running"> {
    updatedAt: number;
    usage: ModelUsage | null;
    payload: ModelType.Payload | null;
  }

  export interface Errored extends BaseStarted<"errored"> {
    endedAt: number;
    request: Request | null;
    response: Response | null;
    error: string;
    usage: ModelUsage | null;
    payload: ModelType.Payload | null;
  }

  export interface Cancelled extends Base<"cancelled"> {
    startedAt: number | undefined;
    endedAt: number;
    payload: ModelType.Payload | null;
  }

  export interface Success extends BaseStarted<"success"> {
    endedAt: number;
    request: Request;
    response: Response;
    usage: ModelUsage;
    payload: ModelType.Payload;
  }

  export type Layout = "vertical" | "horizontal" | "carousel";

  export interface Init {
    setup: Setup;
    datasources: Datasource.Input[];
  }

  export interface Request {
    // TODO: Add details
    payload: object;
  }

  export interface Response {
    // TODO: Add details
    payload: object;
  }

  export interface Input {
    attachments: Attachment.Input[];
  }

  export type Patch<Status extends Result.Status> = Omit<
    Result & { status: Status },
    Exclude<keyof Base<Status>, "id" | "status">
  >;
}

export function buildResultInitialized(
  overrides: Partial<Omit<Result.Initialized, "init">> & {
    init: Result["init"];
  },
): Result.Initialized {
  return {
    id: nanoid(),
    status: "initialized",
    createdAt: Date.now(),
    init: overrides.init,
  };
}
