import { nanoid } from "nanoid";
import { EditorFile } from "../editor";

export interface Csv {
  path: EditorFile.Path;
  hash: string;
  size: number;
  rows: number;
  header: string[];
  settings?: Csv.Settings | undefined;
}

export namespace Csv {
  export type RequestId = string & { [requestIdBrand]: true };
  declare const requestIdBrand: unique symbol;

  export type Request = RequestPending | RequestOk | RequestError;

  export interface RequestPending {
    id: RequestId;
    status: "pending";
    path?: EditorFile.Path | undefined;
  }

  export interface RequestOk {
    id: RequestId;
    status: "ok";
    path: EditorFile.Path;
  }

  export interface RequestError {
    id: RequestId;
    status: "error";
    path?: EditorFile.Path | undefined;
    error: string;
  }

  export interface Settings {
    delimiter?: string | undefined;
  }

  export type ColumnIndex = number & { [columnIndexBrand]: true };
  declare const columnIndexBrand: unique symbol;

  export type RowIndex = number & { [rowIndexBrand]: true };
  declare const rowIndexBrand: unique symbol;
}

export function buildCsvRequestId(): Csv.RequestId {
  return `csv-data-request-${nanoid()}` as Csv.RequestId;
}
