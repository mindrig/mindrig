export type VscMessageDataset =
  | VscMessageDataset.RequestCsv
  | VscMessageDataset.CsvLoaded;

export namespace VscMessageDataset {
  export type Type = "dataset-csv-request" | "dataset-csv-loaded";

  export interface RequestCsv {
    type: "dataset-csv-request";
    payload?: undefined;
  }

  export interface CsvLoaded {
    type: "dataset-csv-loaded";
    payload:
      | {
          path: string;
          content: string;
        }
      | {
          error: string;
        };
  }
}
