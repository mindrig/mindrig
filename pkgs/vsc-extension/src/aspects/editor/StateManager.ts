import { Manager } from "@/aspects/manager/Manager.js";
import { ClientState } from "@wrkspc/core/client";
import { AuthManager } from "../auth/Manager";
import { PlaygroundManager } from "../playground/Manager";
import { SettingsManager } from "../settings/Manager";

export namespace EditorStateManager {
  export interface Props {
    auth: AuthManager;
    settings: SettingsManager;
    playground: PlaygroundManager;
  }
}

export class EditorStateManager extends Manager {
  #auth: AuthManager;
  #settings: SettingsManager;
  #playground: PlaygroundManager;

  constructor(parent: Manager, props: EditorStateManager.Props) {
    super(parent);

    this.#auth = props.auth;
    this.#settings = props.settings;
    this.#playground = props.playground;
  }

  get state(): ClientState {
    return {
      auth: this.#auth.state,
      settings: this.#settings.state,
      playground: this.#playground.state,
    };
  }
}
