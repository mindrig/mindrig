import { Settings } from ".";

export namespace SettingsMessage {
  //#region Server

  export type Server = ServerUpdate;

  export interface ServerUpdate {
    type: "settings-server-update";
    payload: Settings;
  }

  //#endregion

  //#region Client

  export type Client = never;

  //#endregion
}
