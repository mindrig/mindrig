import { Csv } from "@wrkspc/core/csv";
import { DatasetDatasource, DatasetSelection } from "@wrkspc/core/dataset";
import { Datasource } from "@wrkspc/core/datasource";
import { parseStream } from "smolcsv";
import * as vscode from "vscode";
import { Manager } from "../manager/Manager.js";

export namespace DatasetsManager {
  export type Selector = (index: Csv.RowIndex) => SelectorCommand;

  export type SelectorCommand = "break" | "continue" | "add";

  export interface Selected {
    index: Csv.RowIndex;
    row: string[];
  }
}

export class DatasetsManager extends Manager {
  constructor(parent: Manager) {
    super(parent);
  }

  async datasourceToInput(
    datasource: DatasetDatasource,
  ): Promise<Datasource.Input[]> {
    const { data } = datasource;
    if (!data) return [];

    const selector = this.#selector(data.selection);

    const uri = vscode.Uri.file(data.path);
    const bytes = await vscode.workspace.fs.readFile(uri);

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });

    let index: Csv.RowIndex = 0 as Csv.RowIndex;
    let header: string[] | undefined;
    const selected: DatasetsManager.Selected[] = [];
    loop: for await (const row of parseStream(stream)) {
      if (!header) {
        header = row;
        // Skip header from row count
        continue;
      }

      switch (selector(index)) {
        case "break":
          break loop;

        case "add":
          selected.push({ index, row });
      }
      index++;
    }

    // Assign empty array if no header found
    header ||= [];

    return selected.map((selectedItem) => {
      const values: Datasource.Values = {};
      const input: DatasetDatasource.Input = {
        type: "dataset",
        datasourceId: datasource.id,
        index: selectedItem.index,
        values,
      };
      return input;
    });
  }

  #selector(selection: DatasetSelection): DatasetsManager.Selector {
    switch (selection.type) {
      case "all":
        return () => "add";

      case "range":
        const { span } = selection;
        return (index) => {
          if (!span || index > span.end) return "break";
          if (index < span.start) return "continue";
          return "add";
        };

      case "row":
        return (index) => {
          if (selection.index === null || index > selection.index)
            return "break";
          if (index < selection.index) return "continue";
          return "add";
        };
    }
  }
}

const maxCsvResults = 2000;
