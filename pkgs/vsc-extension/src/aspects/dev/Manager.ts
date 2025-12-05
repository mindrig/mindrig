import { Manager } from "@/aspects/manager/Manager.js";
import { MessagesManager } from "../message/Manager";
import { StoreManager } from "../store/Manager";

export namespace DevManager {
  export interface Props {
    messages: MessagesManager;
    store: StoreManager;
  }
}

export class DevManager extends Manager {
  #messages: MessagesManager;
  #store: StoreManager;

  constructor(parent: Manager | null, props: DevManager.Props) {
    super(parent);

    this.#messages = props.messages;
    this.#store = props.store;
  }

  async clearState() {
    await Promise.all([
      this.#store.clearAll(),
      this.#messages.send({ type: "dev-server-clear-app-state" }),
    ]);
  }
}
