import { Attachment, AttachmentRequest } from "@wrkspc/core/attachment";

export namespace AttachmentMessage {
  //#region Server

  export type Server = ServerRead;

  export interface ServerRead {
    type: "attachment-server-read";
    payload: ServerReadPayload;
  }

  export type ServerReadPayload = ServerReadPayloadOk | ServerReadPayloadError;

  export interface ServerReadPayloadOk {
    status: "ok";
    requestId: AttachmentRequest.Id;
    data: Attachment[];
  }

  export interface ServerReadPayloadError {
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
