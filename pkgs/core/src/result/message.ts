import { Result } from "../result/result.js";

export namespace ResultMessage {
  //#region Server

  export type Server = ServerUpdate;

  export interface ServerResultsInitPayload {
    resultId: Result.Id;
  }

  export interface ServerUpdate {
    type: "result-server-update";
    payload: Result.Status extends infer Status extends Result.Status
      ? Status extends Status
        ? Result.Patch<Status>
        : never
      : never;
  }

  //#endregion

  //#region Client

  export type Client = never;
}

//#endregion
