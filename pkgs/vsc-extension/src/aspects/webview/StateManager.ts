import { Manager } from "@/aspects/manager/Manager.js";
import { VscWebviewState } from "@wrkspc/vsc-types";
import { AuthManager } from "../auth/Manager";
import { SettingsManager } from "../settings/Manager";

export namespace WebviewStateManager {
  export interface Props {
    auth: AuthManager;
    settings: SettingsManager;
  }
}

export class WebviewStateManager extends Manager {
  #state: VscWebviewState;
  #auth;
  #settings;

  constructor(parent: Manager, props: WebviewStateManager.Props) {
    super(parent);

    this.#auth = props.auth;
    this.#settings = props.settings;

    this.#state = {
      auth: this.#auth.state,
      settings: this.#settings.state,
    };
  }

  get state(): VscWebviewState {
    return this.#state;
  }
}
