import { DatasetCsv, DatasetRequest } from "@wrkspc/core/dataset";
import { EditorFile } from "../editor";

export namespace DatasetMessage {
  //#region Server

  export type Server = ServerCsvData | ServerCsvSelectCancel;

  export interface ServerCsvData {
    type: "dataset-server-csv-data";
    payload: ServerCsvContentPayload;
  }

  export type ServerCsvContentPayload =
    | ServerCsvContentPayloadOk
    | ServerCsvContentPayloadError;

  export interface ServerCsvContentPayloadOk extends CsvMessagePayload {
    status: "ok";
    data: DatasetCsv.Meta;
  }

  export interface ServerCsvContentPayloadError extends CsvMessagePayload {
    status: "error";
    error: string;
  }

  export interface ServerCsvSelectCancel {
    type: "dataset-server-csv-select-cancel";
    payload: CsvMessagePayload;
  }

  //#endregion

  //#region Client

  export type Client = ClientCsvSelectRequest | ClientCsvLoadRequest;

  export interface ClientCsvSelectRequest {
    type: "dataset-client-csv-select-request";
    payload: ClientCsvSelectRequestPayload;
  }

  export interface ClientCsvSelectRequestPayload extends CsvRequestPayload {
    delimiter?: string;
  }

  export interface ClientCsvLoadRequest {
    type: "dataset-client-csv-load-request";
    payload: ClientCsvLoadRequestPayload;
  }

  export interface ClientCsvLoadRequestPayload extends CsvRequestPayload {
    path: EditorFile.Path;
  }

  export interface CsvRequestPayload extends CsvMessagePayload {
    delimiter?: string;
  }

  //#endregion

  //#region Common

  export interface CsvMessagePayload {
    requestId: DatasetRequest.CsvId;
  }

  //#endregion
}
