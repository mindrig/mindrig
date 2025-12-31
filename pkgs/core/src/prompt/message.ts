import type { Prompt } from "@volumen/types";
import { PromptParse } from ".";
import { EditorFile } from "../editor";

export namespace PromptMessage {
  //#region Server

  export type Server = ServerUpdate;

  export interface ServerUpdate {
    type: "prompt-server-update";
    payload: ServerUpdatePayload;
  }

  export interface ServerUpdatePayload {
    prompts: Prompt[];
    source: PromptParse.Source;
  }

  //#endregion

  //#region Client

  export type Client = ClientReveal;

  export interface ClientReveal {
    type: "prompt-client-reveal";
    payload: EditorFile.Ref;
  }

  //#endregion
}
