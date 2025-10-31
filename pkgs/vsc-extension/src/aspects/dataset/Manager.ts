import { DatasetMessage } from "@wrkspc/core/dataset";
import { always } from "alwaysly";
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
}

export class DatasetsManager extends Manager {
  #messages: MessagesManager;

  constructor(parent: Manager, props: DatasetsManager.Props) {
    super(parent);

    this.#messages = props.messages;

    this.#messages.listen(
      this,
      "dataset-client-csv-request",
      this.#onCsvRequest,
    );
  }

  async #onCsvRequest(message: DatasetMessage.ClientCsvRequest) {
    const { requestId } = message.payload;
    const uri = await this.#selectCsvViaQuickPick();
    if (!uri) return;

    const path = uri.fsPath;
    const bytes = await vscode.workspace.fs.readFile(uri);
    const utf8 = new TextDecoder("utf-8").decode(bytes);

    this.#messages.send({
      type: "dataset-server-csv-content",
      payload: {
        status: "ok",
        requestId,
        data: { path, utf8 },
      },
    });
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
}

const maxCsvResults = 2000;
