import { Csv } from "@wrkspc/core/csv";
import { EditorFile } from "@wrkspc/core/editor";

export namespace CsvAppState {
  export type Csvs = Record<EditorFile.Path, Csv>;
}
