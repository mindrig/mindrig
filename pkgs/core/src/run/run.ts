import { nanoid } from "nanoid";
import { Attachment } from "../attachment/index.js";
import { Datasource } from "../datasource/datasource.js";
import { PlaygroundMap } from "../playground/map.js";
import { Result } from "../result/result.js";
import { Setup } from "../setup/setup.js";
import { Tool } from "../tool/tool.js";

export type Run =
  | Run.Initialized
  | Run.Error
  | Run.Running
  | Run.Cancelled
  | Run.Complete;

export namespace Run {
  export type Id = string & { [idBrand]: true };
  declare const idBrand: unique symbol;

  export type Status = Run["status"];

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

  export interface Error extends Base<"error"> {
    endedAt: number;
    error: string;
  }

  export interface Running extends BaseStarted<"running"> {
    updatedAt: number;
  }

  export interface Cancelled extends BaseStarted<"cancelled"> {
    endedAt: number;
  }

  export interface Complete extends BaseStarted<"complete"> {
    endedAt: number;
  }

  export interface Init {
    prompt: PlaygroundMap.Prompt;
    setups: Setup[];
    tools: Tool[];
    datasources: Datasource[];
    attachments: Attachment[];
    streaming: boolean;
  }

  export type Patch<Status extends Run.Status> = Omit<
    Run & { status: Status },
    Exclude<keyof Base<Status>, "id" | "status">
  >;

  export interface Meta {
    running: boolean;
    complete: boolean;
  }

  export interface Results {
    runId: Id;
    results: Result[];
  }

  export interface Input {
    attachments: Attachment.Input[];
    datasourcesMatrix: Datasource.Input[][];
  }
}

export function buildRunId(): Run.Id {
  return `run-${nanoid()}` as Run.Id;
}

export namespace buildRunInitialized {
  export type Overrides = Partial<Exclude<Run.Initialized, "init">> &
    Pick<Run.Initialized, "init">;
}

export function buildRunInitialized(
  overrides: buildRunInitialized.Overrides,
): Run.Initialized {
  return {
    id: buildRunId(),
    status: "initialized",
    createdAt: Date.now(),
    ...overrides,
  };
}
