import {
  Attachment,
  attachmentDialogTitle,
  attachmentFilters,
  AttachmentMessage,
} from "@wrkspc/core/attachment";
import { FileContent } from "@wrkspc/core/file";
import { LANGUAGE_EXTENSIONS } from "@wrkspc/core/lang";
import { always } from "alwaysly";
import { Mime } from "mime";
import standardMimeTypes from "mime/types/standard.js";
import * as vscode from "vscode";
import { Manager } from "../manager/Manager.js";
import { MessagesManager } from "../message/Manager.js";

const mimeDb = new Mime(standardMimeTypes);

mimeDb.define(
  {
    "text/python": LANGUAGE_EXTENSIONS.py,
    "text/javascript": LANGUAGE_EXTENSIONS.js,
    "text/typescript": LANGUAGE_EXTENSIONS.ts,
  },
  true,
);

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
        type: "attachment-server-read",
        payload: {
          status: "error",
          requestId,
          error: "No files selected",
        },
      });

    const data = await Promise.all(
      uris.map(async (uri) => {
        const name = uri.path.split("/").pop();
        always(name);
        const path = uri.fsPath as Attachment.Path;
        const mime = mimeDb.getType(name) || "application/octet-stream";
        const { size } = await vscode.workspace.fs.stat(uri);
        const attachment: Attachment = { v: 1, name, path, mime, size };
        return attachment;
      }),
    );

    this.#messages.send({
      type: "attachment-server-read",
      payload: {
        status: "ok",
        requestId,
        data,
      },
    });
  }

  async attachmentsToInput(
    attachments: Attachment[],
  ): Promise<Attachment.Input[]> {
    return Promise.all(attachments.map(this.#attachmentToInput.bind(this)));
  }

  async #attachmentToInput(attachment: Attachment): Promise<Attachment.Input> {
    const base64 = await this.read(attachment);
    return {
      path: attachment.path,
      base64,
      mime: attachment.mime,
    };
  }

  async read(attachment: Attachment): Promise<FileContent.Base64> {
    const uri = vscode.Uri.file(attachment.path);
    const data = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(data).toString("base64") as FileContent.Base64;
  }
}
