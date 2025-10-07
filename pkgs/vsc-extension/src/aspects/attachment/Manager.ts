import {
  Attachment,
  attachmentDialogTitle,
  attachmentFilters,
} from "@wrkspc/core/attachment";
import { VscMessageAttachment } from "@wrkspc/core/message";
import { always } from "alwaysly";
import Mime from "mime/lite";
import * as vscode from "vscode";
import { Manager } from "../manager/Manager.js";
import { MessagesManager } from "../message/Manager.js";

export namespace AttachmentsManager {
  export interface Props {
    messages: MessagesManager;
  }
}

export class AttachmentsManager extends Manager {
  #messages: MessagesManager;

  constructor(parent: Manager, props: AttachmentsManager.Props) {
    super(parent);

    this.#messages = props.messages;

    this.#messages.listen(this, "attachment-wv-request", this.#onRequest);
  }

  async #onRequest(message: VscMessageAttachment.WvRequest) {
    const { requestId, modalities } = message.payload;

    const uris = await vscode.window.showOpenDialog({
      canSelectMany: true,
      openLabel: "Attach",
      title: attachmentDialogTitle(modalities),
      filters: attachmentFilters(modalities),
    });

    if (!uris || uris.length === 0)
      return this.#messages.send({
        type: "attachment-ext-content",
        payload: {
          status: "error",
          requestId,
          error: "No files selected",
        },
      });

    const data = await Promise.all(
      uris.map(async (uri) => {
        const data = await vscode.workspace.fs.readFile(uri);
        const base64 = Buffer.from(data).toString("base64");
        const name = uri.path.split("/").pop();
        always(name);
        const path = uri.fsPath;
        const mime = Mime.getType(name) || "application/octet-stream";

        const content: Attachment = { name, path, mime, base64 };
        return content;
      }),
    );

    this.#messages.send({
      type: "attachment-ext-content",
      payload: {
        status: "ok",
        requestId,
        data,
      },
    });
  }
}
