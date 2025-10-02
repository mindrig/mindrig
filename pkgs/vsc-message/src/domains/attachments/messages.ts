export type VscMessageAttachments =
  | VscMessageAttachments.RequestPick
  | VscMessageAttachments.Loaded;

export namespace VscMessageAttachments {
  export type Type = "attachments-request" | "attachments-loaded";

  export interface RequestPick {
    type: "attachments-request";
    payload?: {
      imagesOnly?: boolean;
    };
  }

  export interface Loaded {
    type: "attachments-loaded";
    payload:
      | {
          items: Array<{
            path: string;
            name: string;
            mime: string;
            dataBase64: string;
          }>;
        }
      | {
          error: string;
        };
  }
}
