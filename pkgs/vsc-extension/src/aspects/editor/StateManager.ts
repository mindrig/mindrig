import { Manager } from "@/aspects/manager/Manager.js";
import { EditorState } from "@wrkspc/core/editor";
import { AuthManager } from "../auth/Manager";
import { PromptsManager } from "../prompt/Manager";
import { SettingsManager } from "../settings/Manager";
import { EditorManager } from "./Manager";

export namespace EditorStateManager {
  export interface Props {
    auth: AuthManager;
    settings: SettingsManager;
    prompts: PromptsManager;
    editor: EditorManager;
  }
}

export class EditorStateManager extends Manager {
  #auth: AuthManager;
  #settings: SettingsManager;
  #prompts: PromptsManager;
  #editor: EditorManager;

  constructor(parent: Manager, props: EditorStateManager.Props) {
    super(parent);

    this.#auth = props.auth;
    this.#settings = props.settings;
    this.#prompts = props.prompts;
    this.#editor = props.editor;
  }

  get state(): EditorState {
    return {
      auth: this.#auth.state,
      settings: this.#settings.state,
      prompts: this.#prompts.state,
      file: this.#editor.activeFile,
    };
  }
}
