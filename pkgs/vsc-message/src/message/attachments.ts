export type VscMessageAttachments =
  | VscMessageAttachments.Request
  | VscMessageAttachments.Load;

export namespace VscMessageAttachments {
  export interface Request {
    type: "attachments-request";
    payload?: { imagesOnly?: boolean };
  }

  export interface Load {
    type: "attachments-load";
    payload: LoadPayload;
  }

  export type LoadPayload = LoadPayloadOk | LoadPayloadError;

  export interface LoadPayloadOk {
    status: "ok";
    items: Array<{
      path: string;
      name: string;
      mime: string;
      dataBase64: string;
    }>;
  }

  export interface LoadPayloadError {
    status: "error";
    error: string;
  }
}
