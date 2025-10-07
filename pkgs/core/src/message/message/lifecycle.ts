export type VscMessageLifecycle = VscMessageLifecycle.WebviewReady;

export namespace VscMessageLifecycle {
  //#region Extension

  export type Extension = never;

  //#endregion

  //#region Webview

  export type Webview = WebviewReady;

  /**
   * The webview is rendered for the first time and ready to receive messages.
   */
  export interface WebviewReady {
    type: "lifecycle-wv-ready";
  }

  //#endregion
}
