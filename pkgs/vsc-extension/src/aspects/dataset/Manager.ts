import {
  DatasetCsv,
  DatasetMessage,
  DatasetRequest,
} from "@wrkspc/core/dataset";
import { EditorFile } from "@wrkspc/core/editor";
import { always } from "alwaysly";
import { parseStream } from "smolcsv";
import { xxh32 } from "smolxxh";
import * as vscode from "vscode";
import { Manager } from "../manager/Manager.js";
import { MessagesManager } from "../message/Manager.js";

export namespace DatasetsManager {
  export interface Props {
    messages: MessagesManager;
  }

  export type CsvQuickPickItem =
    | CsvQuickPickItemFile
    | CsvQuickPickItemDialog
    | CsvQuickPickItemDelimiter;

  export interface CsvQuickPickItemFile extends vscode.QuickPickItem {
    type: "file";
    uri: vscode.Uri;
  }

  export interface CsvQuickPickItemDialog extends vscode.QuickPickItem {
    type: "dialog";
  }

  export interface CsvQuickPickItemDelimiter extends vscode.QuickPickItem {
    type: "delimiter";
  }

  export interface LoadAndSendCsvMetaProps {
    requestId: DatasetRequest.CsvId;
    path: EditorFile.Path;
  }
}

export class DatasetsManager extends Manager {
  #messages: MessagesManager;

  constructor(parent: Manager, props: DatasetsManager.Props) {
    super(parent);

    this.#messages = props.messages;

    this.#messages.listen(
      this,
      "dataset-client-csv-select-request",
      this.#onCsvSelectRequest,
    );

    this.#messages.listen(
      this,
      "dataset-client-csv-load-request",
      this.#onCsvLoadRequest,
    );
  }

  async #onCsvSelectRequest(message: DatasetMessage.ClientCsvSelectRequest) {
    const { requestId } = message.payload;

    const uri = await this.#selectCsvViaQuickPick();
    if (!uri) {
      return this.#messages.send({
        type: "dataset-server-csv-select-cancel",
        payload: { requestId },
      });
    }

    return this.#loadAndSendCsvMeta({
      path: uri.fsPath as EditorFile.Path,
      requestId,
    });
  }

  #onCsvLoadRequest(message: DatasetMessage.ClientCsvLoadRequest) {
    return this.#loadAndSendCsvMeta(message.payload);
  }

  async #selectCsvViaQuickPick() {
    if (!vscode.workspace.workspaceFolders?.length)
      return this.#selectCsvViaDialog();

    const quickPick =
      vscode.window.createQuickPick<DatasetsManager.CsvQuickPickItem>();

    quickPick.placeholder = "Search CSV files by name or path";
    quickPick.matchOnDescription = true;
    quickPick.ignoreFocusOut = true;

    quickPick.busy = true;

    const uris = await vscode.workspace.findFiles(
      "**/*.csv",
      undefined,
      maxCsvResults,
    );

    if (!uris.length) {
      quickPick.dispose();
      vscode.window.showInformationMessage(
        "No CSV files found in this workspace, falling back for file dialog.",
      );
      return this.#selectCsvViaDialog();
    }

    const items: DatasetsManager.CsvQuickPickItem[] = uris.map((uri) => {
      const label = uri.path.split("/").pop();
      always(label);
      const description = uri.fsPath;
      const item: DatasetsManager.CsvQuickPickItemFile = {
        type: "file",
        label,
        description,
        uri,
      };
      return item;
    });

    items.push({
      type: "dialog",
      label: "Browse files...",
      description: "Select a CSV file from your file system.",
    });

    quickPick.items = items;
    quickPick.busy = false;

    const selection = await new Promise<
      DatasetsManager.CsvQuickPickItem | undefined
    >((resolve) => {
      quickPick.onDidAccept(() => resolve(quickPick.selectedItems[0]));
      quickPick.onDidHide(() => resolve(undefined));
      quickPick.show();
    });

    quickPick.dispose();

    if (selection?.type === "dialog") return this.#selectCsvViaDialog();

    if (selection?.type === "file") return selection.uri;
  }

  async #selectCsvViaDialog(): Promise<vscode.Uri | undefined> {
    const uris = await vscode.window.showOpenDialog({
      openLabel: "Select",
      title: "Select CSV file",
      filters: {
        "CSV files": ["csv"],
        "All files": ["*"],
      },
    });
    return uris?.[0];
  }

  async #loadAndSendCsvMeta(props: DatasetsManager.LoadAndSendCsvMetaProps) {
    const { requestId, path } = props;
    const uri = vscode.Uri.file(path);

    const bytes = await vscode.workspace.fs.readFile(uri);
    const size = bytes.length;
    const hash = xxh32(Buffer.from(bytes)).toString(16);

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });

    let rows = 0;
    let header: string[] | undefined;
    for await (const row of parseStream(stream)) {
      if (!header) {
        header = row;
        // Skip header from row count
        continue;
      }
      rows++;
    }

    // Assign empty array if no header found
    header ||= [];

    const meta: DatasetCsv.Meta = {
      path,
      hash,
      size,
      rows,
      header,
    };

    return this.#messages.send({
      type: "dataset-server-csv-data",
      payload: { status: "ok", requestId, data: meta },
    });
  }
}

const maxCsvResults = 2000;
