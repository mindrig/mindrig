import { PlaygroundMap, PlaygroundState } from "./index.js";

export namespace PlaygroundMessage {
  //#region Server

  export type Server = ServerUpdate;

  export interface ServerUpdate {
    type: "playground-server-update";
    payload: PlaygroundState;
  }

  //#endregion

  //#region Client

  export type Client =
    | ClientPin
    | ClientUnpin
    | ClientPromptChange
    | ClientNewDraft
    | ClientDraftUpdate;

  export interface ClientPin {
    type: "playground-client-pin";
    payload: PlaygroundState.Ref;
  }

  export interface ClientUnpin {
    type: "playground-client-unpin";
  }

  export interface ClientPromptChange {
    type: "playground-client-prompt-change";
    payload: PlaygroundState.Ref | null;
  }

  export interface ClientNewDraft {
    type: "playground-client-new-draft";
  }

  export interface ClientDraftUpdate {
    type: "playground-client-draft-update";
    payload: ClientDraftUpdatePayload;
  }

  export interface ClientDraftUpdatePayload {
    promptId: PlaygroundMap.PromptId;
    content: string;
  }

  //#endregion
}
