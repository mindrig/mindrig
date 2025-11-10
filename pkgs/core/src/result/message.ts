import { Result } from "../result/result.js";
import { Run } from "../run/run.js";

export namespace ResultMessage {
  //#region Server

  export type Server = ServerUpdate | ServerStream;

  export interface ServerUpdate {
    type: "result-server-update";
    payload: ServerUpdatePayload;
  }

  export interface ServerUpdatePayload {
    runId: Run.Id;
    patch: ServerUpdatePayloadPatch;
  }

  export type ServerUpdatePayloadPatch =
    Result.Status extends infer Status extends Result.Status
      ? Status extends Status
        ? Result.Patch<Status>
        : never
      : never;

  export interface ServerStream {
    type: "result-server-stream";
    payload: ServerStreamPayload;
  }

  export interface ServerStreamPayload {
    runId: Run.Id;
    resultId: Result.Id;
    textChunk: string;
  }

  //#endregion

  //#region Client

  export type Client = never;
}

//#endregion
