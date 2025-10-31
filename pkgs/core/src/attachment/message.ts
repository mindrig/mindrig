import { Attachment, AttachmentRequest } from "@wrkspc/core/attachment";

export namespace AttachmentMessage {
  //#region Server

  export type Server = ServerContent;

  export interface ServerContent {
    type: "attachment-server-content";
    payload: ServerContentPayload;
  }

  export type ServerContentPayload =
    | ServerContentPayloadOk
    | ServerContentPayloadError;

  export interface ServerContentPayloadOk {
    status: "ok";
    requestId: AttachmentRequest.Id;
    data: Attachment[];
  }

  export interface ServerContentPayloadError {
    status: "error";
    requestId: AttachmentRequest.Id;
    error: string;
  }

  //#endregion

  //#region Client

  export type Client = ClientRequest;

  export interface ClientRequest {
    type: "attachment-client-request";
    payload: ClientRequestPayload;
  }

  export interface ClientRequestPayload {
    requestId: AttachmentRequest.Id;
    modalities: AttachmentRequest.Modalities;
  }

  //#endregion
}
