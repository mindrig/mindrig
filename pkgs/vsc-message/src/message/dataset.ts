export type VscMessageDataset =
  | VscMessageDataset.CsvRequest
  | VscMessageDataset.CsvLoad;

export namespace VscMessageDataset {
  export interface CsvRequest {
    type: "dataset-csv-request";
    payload?: undefined;
  }

  export interface CsvLoad {
    type: "dataset-csv-load";
    payload: CsvLoadPayload;
  }

  export type CsvLoadPayload = CsvLoadPayloadOk | CsvLoadPayloadError;

  export interface CsvLoadPayloadOk {
    status: "ok";
    path: string;
    content: string;
  }

  export interface CsvLoadPayloadError {
    status: "error";
    error: string;
  }
}
