import {
  ModelDotdev,
  modelResponseErrorData,
  modelsDotdevUrl,
} from "@wrkspc/core/model";
import { Manager } from "../manager/Manager.js";
import { MessagesManager } from "../message/Manager.js";
import { RequestCacheManager } from "../request/CacheManager.js";
import { RequestRefreshManager } from "./RefreshManager.js";

export namespace ModelsDotdevManager {
  export interface Props {
    messages: MessagesManager;
  }
}

export class ModelsDotdevManager extends Manager {
  #messages: MessagesManager;
  #pendingFetch: Promise<void> | undefined;
  #cache = new RequestCacheManager(this, {
    ttl: cacheTtl,
    provider: cacheProvider,
  });

  #refresh = new RequestRefreshManager(this, {
    ttl: cacheTtl,
    provider: { fetch: () => this.#fetch() },
  });

  constructor(parent: Manager, props: ModelsDotdevManager.Props) {
    super(parent);

    this.#messages = props.messages;

    this.#messages.listen(this, "models-client-dotdev-refresh", this.#fetch);

    this.#fetch();
  }

  async #fetch() {
    if (this.#pendingFetch) return this.#pendingFetch;

    const cache = this.#cache.access();
    if (cache) return cache;

    this.#pendingFetch = this.#fetchResponse().then((response) => {
      // Set up refetching
      this.#refresh.update(response.data.status === "ok");

      // Cache response
      this.#cache.store(response);

      // Send models to webview
      this.#messages.send({
        type: "models-server-dotdev-response",
        payload: response,
      });

      this.#pendingFetch = undefined;
    });
  }

  async #fetchResponse(): Promise<ModelDotdev.ListResponse> {
    const response = await fetch(modelsDotdevUrl);

    let data: ModelDotdev.ListResponseData;
    if (response.ok) {
      try {
        const payload = (await response.json()) as ModelDotdev.ApiListPayload;
        data = {
          status: "ok",
          payload,
        };
      } catch (err) {
        data = modelResponseErrorData(err);
      }
    } else {
      data = modelResponseErrorData(
        `Failed to fetch models.dev data: ${response.status} ${response.statusText}`,
      );
    }

    return {
      fetchedAt: Date.now(),
      data,
    };
  }
}

const cacheTtl = 1000 * 60 * 60; // 1 hour

const cacheProvider: RequestCacheManager.Provider<ModelDotdev.ListResponse> = {
  fetchedAt: (response) => response.fetchedAt,

  ok: (response) => response.data.status === "ok",
};
