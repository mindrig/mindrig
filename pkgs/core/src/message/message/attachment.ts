import { Attachment, AttachmentRequest } from "@wrkspc/core/attachment";

export type VscMessageAttachment =
  | VscMessageAttachment.WvRequest
  | VscMessageAttachment.ExtContent;

export namespace VscMessageAttachment {
  //#region Extension

  export type Extension = ExtContent;

  export interface ExtContent {
    type: "attachment-ext-content";
    payload: ExtContentPayload;
  }

  export type ExtContentPayload = ExtContentPayloadOk | ExtContentPayloadError;

  export interface ExtContentPayloadOk {
    status: "ok";
    requestId: AttachmentRequest.Id;
    data: Attachment[];
  }

  export interface ExtContentPayloadError {
    status: "error";
    requestId: AttachmentRequest.Id;
    error: string;
  }

  //#endregion

  //#region Webview

  export type Webview = WvRequest;

  export interface WvRequest {
    type: "attachment-wv-request";
    payload: WvRequestPayload;
  }

  export interface WvRequestPayload {
    requestId: AttachmentRequest.Id;
    modalities: AttachmentRequest.Modalities;
  }

  //#endregion
}
