import { Manager } from "../manager/Manager";

export namespace RequestRefreshManager {
  export interface Props {
    ttl: number; // in milliseconds
    provider: Provider;
  }

  export interface Provider {
    fetch(): Promise<unknown>;
  }
}

export class RequestRefreshManager extends Manager {
  #ttl: number;
  #provider: RequestRefreshManager.Provider;
  #timer: NodeJS.Timeout | undefined;

  constructor(parent: Manager, props: RequestRefreshManager.Props) {
    super(parent);

    this.#ttl = props.ttl;
    this.#provider = props.provider;

    this.register({ dispose: () => clearInterval(this.#timer) });
  }

  update(ok: boolean) {
    clearInterval(this.#timer);
    if (!ok) return;
    this.#timer = setInterval(
      () => this.#provider.fetch(),
      this.#ttl + 1000 * 15, // TTL + 15 seconds buffer
    );
  }
}
