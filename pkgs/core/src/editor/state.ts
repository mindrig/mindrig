import { ClientState } from "../client";
import { EditorFile } from "./file";

export interface EditorState extends ClientState {
  file: EditorFile | null;
}
