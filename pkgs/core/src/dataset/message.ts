import { DatasetCsvContent, DatasetRequest } from "@wrkspc/core/dataset";

export namespace DatasetMessage {
  //#region Server

  export type Server = ServerCsvContent;

  export interface ServerCsvContent {
    type: "dataset-server-csv-content";
    payload: ServerCsvContentPayload;
  }

  export type ServerCsvContentPayload =
    | ServerCsvContentPayloadOk
    | ServerCsvContentPayloadError;

  export interface ServerCsvContentPayloadOk {
    status: "ok";
    requestId: DatasetRequest.CsvId;
    data: DatasetCsvContent;
  }

  export interface ServerCsvContentPayloadError {
    status: "error";
    requestId: DatasetRequest.CsvId;
    error: string;
  }

  //#endregion

  //#region Client

  export type Client = ClientCsvRequest;

  export interface ClientCsvRequest {
    type: "dataset-client-csv-request";
    payload: ClientCsvRequestPayload;
  }

  export interface ClientCsvRequestPayload {
    requestId: DatasetRequest.CsvId;
  }

  //#endregion
}
