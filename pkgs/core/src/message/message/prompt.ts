import type { Prompt } from "@mindrig/types";
import { EditorFile } from "../../editor";
import { PromptParse } from "../../prompt";

export type VscMessagePrompt =
  | VscMessagePrompt.ExtUpdate
  | VscMessagePrompt.WvReveal;

export namespace VscMessagePrompt {
  //#region Extension

  export type Extension = ExtUpdate;

  export interface ExtUpdate {
    type: "prompt-ext-update";
    payload: ExtUpdatePayload;
  }

  export interface ExtUpdatePayload {
    prompts: Prompt[];
    source: PromptParse.Source;
  }

  //#endregion

  //#region Webview

  export type Webview = WvReveal;

  export interface WvReveal {
    type: "prompt-wv-reveal";
    payload: EditorFile.Ref;
  }

  //#endregion
}
