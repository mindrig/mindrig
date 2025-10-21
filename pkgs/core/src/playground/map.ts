import type { EditorFile } from "../editor/index.js";

export interface PlaygroundMap {
  files: Record<EditorFile.Path, PlaygroundMap.File>;
  updatedAt: number;
}

export namespace PlaygroundMap {
  export type FileId = string & { [fileIdBrand]: true };
  declare const fileIdBrand: unique symbol;

  export type PromptId = string & { [promptIdBrand]: true };
  declare const promptIdBrand: unique symbol;

  export interface File {
    id: FileId;
    path: EditorFile.Path;
    updatedAt: number;
    prompts: Prompt[];
  }

  export interface Prompt {
    id: PromptId;
    content: string;
    updatedAt: number;
  }

  export interface Matching {
    reason: MatchingReason;
    score: number;
  }

  export type MatchingReason = "content" | "distance" | "new";
}
