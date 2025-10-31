import { Page } from "../page";

export namespace ClientMessage {
  //#region Server

  export type Server = ServerNavigate;

  export interface ServerNavigate {
    type: "client-server-navigate";
    payload: Page;
  }

  //#endregion

  //#region Client

  export type Client = ClientReady | ClientNavigated;

  /**
   * The client is rendered for the first time and ready to receive messages.
   */
  export interface ClientReady {
    type: "client-client-ready";
  }

  export interface ClientNavigated {
    type: "client-client-navigated";
    payload: Page;
  }

  //#endregion
}
