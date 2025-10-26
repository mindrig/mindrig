import { PlaygroundState } from "../../playground/index.js";

export namespace VscMessagePlayground {
  //#region Extension

  export type Extension = ExtUpdate;

  export interface ExtUpdate {
    type: "playground-ext-update";
    payload: PlaygroundState;
  }

  //#endregion

  //#region Webview

  export type Webview = WvPin | WvUnpin | WvPromptChange;

  export interface WvPin {
    type: "playground-wv-pin";
    payload: PlaygroundState.Ref;
  }

  export interface WvUnpin {
    type: "playground-wv-unpin";
  }

  export interface WvPromptChange {
    type: "playground-wv-prompt-change";
    payload: PlaygroundState.Ref | null;
  }

  //#endregion
}
