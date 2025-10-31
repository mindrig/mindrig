import { PlaygroundState } from "./index.js";

export namespace PlaygroundMessage {
  //#region Server

  export type Server = ServerUpdate;

  export interface ServerUpdate {
    type: "playground-server-update";
    payload: PlaygroundState;
  }

  //#endregion

  //#region Client

  export type Client = ClientPin | ClientUnpin | ClientPromptChange;

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

  //#endregion
}
