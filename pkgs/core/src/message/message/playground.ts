import { PlaygroundState } from "../../playground/index.js";

export namespace VscMessagePlayground {
  //#region Extension

  export type Extension = ExtState;

  export interface ExtState {
    type: "playground-ext-state";
    payload: PlaygroundState;
  }

  //#endregion

  //#region Webview

  export type Webview =
    | VscMessagePlayground.WvRequestState
    | VscMessagePlayground.WvPin
    | VscMessagePlayground.WvUnpin
    | VscMessagePlayground.WvPromptChange;

  export interface WvRequestState {
    type: "playground-wv-request-state";
  }

  export interface WvPin {
    type: "playground-wv-pin";
    payload: PlaygroundState.Ref;
  }

  export interface WvUnpin {
    type: "playground-wv-unpin";
  }

  export interface WvPromptChange {
    type: "playground-wv-prompt-change";
    payload: PlaygroundState.Ref;
  }

  //#endregion
}
