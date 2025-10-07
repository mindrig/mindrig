export type VscMessageAttachments =
  | VscMessageAttachments.Request
  | VscMessageAttachments.Load;

export namespace VscMessageAttachments {
  //#region Extension

  export type Extension = never;

  //#endregion

  //#region Webview

  export type Webview = never;

  //#endregion

  //#region Legacy

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

  //#endregion
}
