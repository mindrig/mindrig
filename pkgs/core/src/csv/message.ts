import { EditorFile } from "../editor";
import { Csv } from "./csv";

export namespace CsvMessage {
  //#region Server

  export type Server = ServerData | ServerSelectCancel;

  export interface ServerData {
    type: "csv-server-data";
    payload: ServerDataPayload;
  }

  export type ServerDataPayload = ServerDataPayloadOk | ServerDataPayloadError;

  export interface ServerDataPayloadOk extends RequestPayload {
    status: "ok";
    data: Csv;
  }

  export interface ServerDataPayloadError extends RequestPayload {
    status: "error";
    error: string;
  }

  export interface ServerSelectCancel {
    type: "csv-server-select-cancel";
    payload: RequestPayload;
  }

  //#endregion

  //#region Client

  export type Client = ClientSelectRequest | ClientDataRequest;

  export interface ClientSelectRequest {
    type: "csv-client-select-request";
    payload: ClientRequestWithDataPayload;
  }

  export interface ClientDataRequest {
    type: "csv-client-data-request";
    payload: ClientDataRequestPayload;
  }

  export interface ClientDataRequestPayload
    extends ClientRequestWithDataPayload {
    path: EditorFile.Path;
  }

  export interface ClientRequestWithDataPayload extends RequestPayload {
    settings?: Csv.Settings | undefined;
  }

  //#endregion

  //#region Common

  export interface RequestPayload {
    requestId: Csv.RequestId;
  }

  //#endregion
}
