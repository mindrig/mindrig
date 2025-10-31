import { Manager } from "@/aspects/manager/Manager.js";
import { ClientMessage } from "@wrkspc/core/client";
import { Page } from "@wrkspc/core/page";
import { MessagesManager } from "../message/Manager";

export namespace PageManager {
  export interface Props {
    messages: MessagesManager;
  }
}

export class PageManager extends Manager {
  #messages: MessagesManager;
  #page: Page;

  constructor(parent: Manager, props: PageManager.Props) {
    super(parent);

    this.#messages = props.messages;

    this.#page = { type: "playground" };

    this.#messages.listen(this, "client-client-navigated", this.#onUpdate);
  }

  navigate(page: Page) {
    // NOTE: We don't update internal state here, we wait for the webview to
    // send us the update instead.
    this.#messages.send({ type: "client-server-navigate", payload: page });
  }

  #onUpdate(message: ClientMessage.ClientNavigated) {
    this.#page = message.payload;
  }
}
