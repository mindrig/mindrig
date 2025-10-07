import { DatasetCsvContent, DatasetRequest } from "@wrkspc/core/dataset";

export type VscMessageDataset =
  | VscMessageDataset.WvCsvRequest
  | VscMessageDataset.ExtCsvContent;

export namespace VscMessageDataset {
  //#region Extension

  export type Extension = ExtCsvContent;

  export interface ExtCsvContent {
    type: "dataset-ext-csv-content";
    payload: ExtCsvContentPayload;
  }

  export type ExtCsvContentPayload =
    | ExtCsvContentPayloadOk
    | ExtCsvContentPayloadError;

  export interface ExtCsvContentPayloadOk {
    status: "ok";
    requestId: DatasetRequest.CsvId;
    data: DatasetCsvContent;
  }

  export interface ExtCsvContentPayloadError {
    status: "error";
    requestId: DatasetRequest.CsvId;
    error: string;
  }

  //#endregion

  //#region Webview

  export type Webview = WvCsvRequest;

  export interface WvCsvRequest {
    type: "dataset-wv-csv-request";
    payload: WvCsvRequestPayload;
  }

  export interface WvCsvRequestPayload {
    requestId: DatasetRequest.CsvId;
  }

  //#endregion
}
