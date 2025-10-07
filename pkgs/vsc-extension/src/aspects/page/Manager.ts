import { Manager } from "@/aspects/manager/Manager.js";
import { VscMessagePage } from "@wrkspc/core/message";
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

    this.#messages.listen(this, "page-wv-update", this.#onUpdate);
  }

  navigate(page: Page) {
    // NOTE: We don't update internal state here, we wait for the webview to
    // send us the update instead.
    this.#messages.send({ type: "page-ext-open", payload: page });
  }

  #onUpdate(message: VscMessagePage.WvUpdate) {
    this.#page = message.payload;
  }
}
