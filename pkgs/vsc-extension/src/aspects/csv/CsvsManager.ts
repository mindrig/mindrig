import { Csv, CsvMessage } from "@wrkspc/core/csv";
import { EditorFile } from "@wrkspc/core/editor";
import { always } from "alwaysly";
import { parseStream } from "smolcsv";
import { xxh32 } from "smolxxh";
import * as vscode from "vscode";
import { fileNameFromUri } from "../file/path.js";
import { Manager } from "../manager/Manager.js";
import { MessagesManager } from "../message/Manager.js";

export namespace CsvsManager {
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
    requestId: Csv.RequestId;
    path: EditorFile.Path;
  }
}

export class CsvsManager extends Manager {
  #messages: MessagesManager;

  constructor(parent: Manager, props: CsvsManager.Props) {
    super(parent);

    this.#messages = props.messages;

    this.#messages.listen(
      this,
      "csv-client-select-request",
      this.#onSelectRequest,
    );

    this.#messages.listen(this, "csv-client-data-request", this.#onDataRequest);
  }

  async #onSelectRequest(message: CsvMessage.ClientSelectRequest) {
    const { requestId } = message.payload;

    const uri = await this.#selectCsvViaQuickPick();
    if (!uri) {
      return this.#messages.send({
        type: "csv-server-select-cancel",
        payload: { requestId },
      });
    }

    return this.#loadAndSendCsvData({
      path: uri.fsPath as EditorFile.Path,
      requestId,
    });
  }

  #onDataRequest(message: CsvMessage.ClientDataRequest) {
    return this.#loadAndSendCsvData(message.payload);
  }

  async #selectCsvViaQuickPick() {
    if (!vscode.workspace.workspaceFolders?.length)
      return this.#selectCsvViaDialog();

    const quickPick =
      vscode.window.createQuickPick<CsvsManager.CsvQuickPickItem>();

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

    const items: CsvsManager.CsvQuickPickItem[] = uris.map((uri) => {
      const label = uri.path.split("/").pop();
      always(label);
      const description = uri.fsPath;
      const item: CsvsManager.CsvQuickPickItemFile = {
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
      CsvsManager.CsvQuickPickItem | undefined
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

  async #loadAndSendCsvData(props: CsvsManager.LoadAndSendCsvMetaProps) {
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

    const name = fileNameFromUri(uri);

    const data: Csv = {
      name,
      path,
      hash,
      size,
      rows,
      header,
    };

    return this.#messages.send({
      type: "csv-server-data",
      payload: { status: "ok", requestId, data },
    });
  }
}

const maxCsvResults = 2000;
