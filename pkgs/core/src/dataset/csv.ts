import { EditorFile } from "../editor";

export namespace DatasetCsv {
  export interface Meta {
    path: EditorFile.Path;
    hash: string;
    size: number;
    rows: number;
    header: string[];
  }
}
