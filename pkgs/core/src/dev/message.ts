export namespace DevMessage {
  //#region Server

  export type Server = ServerClearAppState;

  export interface ServerClearAppState {
    type: "dev-server-clear-app-state";
  }

  //#endregion

  //#region Client

  export type Client = never;

  //#endregion
}
