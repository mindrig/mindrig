import {
  Attachment,
  attachmentDialogTitle,
  attachmentFilters,
  AttachmentMessage,
} from "@wrkspc/core/attachment";
import { FileContent } from "@wrkspc/core/file";
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

    this.#messages.listen(this, "attachment-client-request", this.#onRequest);
  }

  async #onRequest(message: AttachmentMessage.ClientRequest) {
    const { requestId, modalities } = message.payload;

    const uris = await vscode.window.showOpenDialog({
      canSelectMany: true,
      openLabel: "Attach",
      title: attachmentDialogTitle(modalities),
      filters: attachmentFilters(modalities),
    });

    if (!uris || uris.length === 0)
      return this.#messages.send({
        type: "attachment-server-content",
        payload: {
          status: "error",
          requestId,
          error: "No files selected",
        },
      });

    const data = uris.map((uri) => {
      const name = uri.path.split("/").pop();
      always(name);
      const path = uri.fsPath as Attachment.Path;
      const mime = Mime.getType(name) || "application/octet-stream";

      const attachment: Attachment = { name, path, mime };
      return attachment;
    });

    this.#messages.send({
      type: "attachment-server-content",
      payload: {
        status: "ok",
        requestId,
        data,
      },
    });
  }

  async read(attachment: Attachment): Promise<FileContent.Base64> {
    const uri = vscode.Uri.file(attachment.path);
    const data = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(data).toString("base64") as FileContent.Base64;
  }
}
