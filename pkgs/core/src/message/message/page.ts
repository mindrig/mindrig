import { Page } from "../../page/index.js";

export namespace VscMessagePage {
  //#region Extension

  export type Extension = ExtOpen;

  export interface ExtOpen {
    type: "page-ext-open";
    payload: Page;
  }

  //#endregion

  //#region Webview

  export type Webview = WvUpdate;

  export interface WvUpdate {
    type: "page-wv-update";
    payload: Page;
  }

  //#endregion
}
