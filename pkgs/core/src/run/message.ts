import { Result } from "../result/result.js";
import type { Run } from "./index.js";

export namespace RunMessage {
  //#region Server

  export type Server = ServerTrigger | ServerResultsInit | ServerUpdate;

  export interface ServerTrigger {
    type: "run-server-trigger";
  }

  export interface ServerResultsInit {
    type: "run-server-results-init";
    payload: ServerResultsInitPayload;
  }

  export interface ServerResultsInitPayload {
    runId: Run.Id;
    results: Result.Initialized[];
  }

  export interface ServerUpdate {
    type: "run-server-update";
    payload: Run.Status extends infer Status extends Run.Status
      ? Status extends Status
        ? Run.Patch<Status>
        : never
      : never;
  }

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
