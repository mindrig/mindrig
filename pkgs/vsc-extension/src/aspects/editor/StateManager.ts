import { Manager } from "@/aspects/manager/Manager.js";
import { EditorState } from "@wrkspc/core/editor";
import { AuthManager } from "../auth/Manager";
import { PlaygroundManager } from "../playground/Manager";
import { SettingsManager } from "../settings/Manager";
import { EditorManager } from "./Manager";

export namespace EditorStateManager {
  export interface Props {
    auth: AuthManager;
    settings: SettingsManager;
    editor: EditorManager;
    playground: PlaygroundManager;
  }
}

export class EditorStateManager extends Manager {
  #auth: AuthManager;
  #settings: SettingsManager;
  #editor: EditorManager;
  #playground: PlaygroundManager;

  constructor(parent: Manager, props: EditorStateManager.Props) {
    super(parent);

    this.#auth = props.auth;
    this.#settings = props.settings;
    this.#editor = props.editor;
    this.#playground = props.playground;
  }

  get state(): EditorState {
    return {
      auth: this.#auth.state,
      settings: this.#settings.state,
      playground: this.#playground.state,
      file: this.#editor.activeFile,
    };
  }
}
