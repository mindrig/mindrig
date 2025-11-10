import { Attachment } from "../attachment/index.js";
import { Datasource } from "../datasource/datasource.js";
import { FileContent } from "../file/content.js";
import { PlaygroundMap } from "../playground/map.js";
import { Result } from "../result/result.js";
import { Setup } from "../setup/setup.js";
import { Tool } from "../tool/tool.js";

export type Run = Run.Initialized | Run.Error | Run.Running | Run.Complete;

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
    assignments: Assignments;
    results: Result[];
    startedAt: number;
    // TODO: Include actual data?!
    // - datasources
    // - attachments
  }

  export interface Error extends Base<"error"> {
    erroredAt: number;
    error: string;
  }

  export interface Running extends BaseStarted<"running"> {
    updatedAt: number;
  }

  export interface Complete extends BaseStarted<"complete"> {
    completedAt: number;
  }

  export interface Init {
    prompt: PlaygroundMap.Prompt;
    setups: Setup[];
    tools: Tool[];
    datasources: Datasource[];
    attachments: Attachment[];
    streaming: boolean;
  }

  export interface Assignments {
    attachments: AssignmentsAttachments;
  }

  export type AssignmentsAttachments = Record<
    Attachment.Path,
    FileContent.Base64
  >;

  export type AssignmentsDatasources = Record<
    Datasource.Id,
    Datasource.ItemRef
  >;

  export type Patch<Status extends Run.Status> = Omit<
    Run & { status: Status },
    Exclude<keyof Base<Status>, "id" | "status">
  >;

  export interface Meta {
    running: boolean;
    complete: boolean;
  }
}
