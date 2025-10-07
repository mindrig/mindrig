import { createGateway } from "@ai-sdk/gateway";
import { Auth, AuthGateway } from "@wrkspc/core/auth";
import {
  ModelGateway,
  ModelResponse,
  modelResponseErrorData,
  ModelVercel,
} from "@wrkspc/core/model";
import { createHash } from "node:crypto";
import { AuthManager } from "../auth/Manager.js";
import { Manager } from "../manager/Manager.js";
import { MessagesManager } from "../message/Manager.js";
import { RequestCacheManager } from "../request/CacheManager.js";
import { SecretsManager } from "../secret/Manager.js";
import { RequestRefreshManager } from "./RefreshManager.js";

export namespace ModelsGatewayManager {
  export interface Props {
    auth: AuthManager;
    secrets: SecretsManager;
    messages: MessagesManager;
  }

  export type CacheManager = ReturnType<typeof createCache>;
}

export class ModelsGatewayManager extends Manager {
  private static readonly globalGatewayOrigin = import.meta.env
    .VITE_MINDRIG_GATEWAY_ORIGIN;

  private static readonly cacheTtl = 1000 * 60 * 60; // 1 hour

  #auth: AuthManager;
  #secrets: SecretsManager;
  #messages: MessagesManager;

  #refetch = new RequestRefreshManager(this, {
    ttl: ModelsGatewayManager.cacheTtl,
    provider: { fetch: () => this.#fetch(this.#auth.state.gateway) },
  });

  #pendingFetch: Promise<void> | undefined;

  constructor(parent: Manager, props: ModelsGatewayManager.Props) {
    super(parent);

    this.#auth = props.auth;
    this.#secrets = props.secrets;
    this.#messages = props.messages;

    this.#fetch(this.#auth.state.gateway);

    this.#auth.on(this, "gateway-resolve", this.#onAuthResolve);

    this.#messages.listen(this, "models-wv-gateway-refresh", () =>
      this.#fetch(this.#auth.state.gateway),
    );
  }

  async #fetch(auth: Auth.GatewayValue) {
    if (this.#pendingFetch) return this.#pendingFetch;

    this.#pendingFetch = (
      auth ? this.#fetchAuthScoped(auth) : this.#fetchGlobal()
    ).then((response) => {
      // Set up refetching
      this.#refetch.update(response.data.status === "ok");

      // Cache response
      this.#cache(response.source.type).store(response);

      // Send models to webview
      this.#messages.send({
        type: "models-ext-gateway-response",
        payload: response,
      });

      // Report status to auth
      if (auth)
        this.#auth.emit(
          "gateway-response",
          response.data.status === "ok"
            ? auth
            : {
                ...auth,
                error: response.data.message,
              },
        );

      this.#pendingFetch = undefined;
    });
  }

  async #fetchAuthScoped(
    gateway: AuthGateway,
  ): Promise<ModelGateway.ListResponse> {
    switch (gateway.type) {
      case "vercel":
        return this.#fetchAuthScopedVercel();
    }
  }

  async #fetchAuthScopedVercel(): Promise<ModelVercel.ListResponse> {
    const apiKey = await this.#secrets.get("auth-vercel-gateway-key");
    if (!apiKey) return this.#fetchGlobal();

    const source: ModelGateway.ListSource = {
      type: "auth",
      hash: vercelKeyHash(apiKey),
    };

    const cache = this.#cache("auth").access(source);
    if (cache) return cache;

    const gateway = createGateway({ apiKey });

    let data: ModelVercel.ListResponseData;
    try {
      const vercelData = await gateway.getAvailableModels();
      data = {
        status: "ok",
        payload: vercelData as ModelVercel.ApiGetAvailableModelsPayload,
      };
    } catch (err) {
      data = this.#errorToData(err);
    }

    return {
      type: "vercel",
      source,
      fetchedAt: Date.now(),
      data,
    };
  }

  async #fetchGlobal(): Promise<ModelVercel.ListResponse> {
    const source: ModelGateway.ListSourceGlobal = { type: "global" };

    const cache = this.#cache("global").access(source);
    if (cache) return cache;

    const response = await fetch(
      `${ModelsGatewayManager.globalGatewayOrigin}/vercel/models`,
    );

    let data: ModelVercel.ListResponseData;
    if (response.ok) {
      try {
        const payload =
          (await response.json()) as ModelVercel.ApiGetAvailableModelsPayload;
        data = {
          status: "ok",
          payload,
        };
      } catch (err) {
        data = modelResponseErrorData(err);
      }
    } else {
      data = modelResponseErrorData(
        `Failed to fetch models list: ${response.status} ${response.statusText}`,
      );
    }

    return {
      type: "vercel",
      source,
      fetchedAt: Date.now(),
      data,
    };
  }

  #errorToData(error: unknown): ModelResponse.DataError {
    return {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }

  #onAuthResolve(auth: Auth.GatewayValue) {
    this.#fetch(auth);
  }

  #globalCache = createCache(this);
  #authCache = createCache(this);

  #cache(
    sourceType: ModelGateway.ListSourceType,
  ): ModelsGatewayManager.CacheManager {
    switch (sourceType) {
      case "global":
        return this.#globalCache;

      case "auth":
        return this.#authCache;
    }
  }
}

function createCache(manager: Manager) {
  return new RequestCacheManager(manager, {
    ttl: cacheTtl,
    provider: cacheProvider,
  });
}

const cacheTtl = 1000 * 60 * 60; // 1 hour

const cacheProvider: RequestCacheManager.Provider<
  ModelGateway.ListResponse,
  ModelGateway.ListSource
> = {
  hash: {
    content: (source) =>
      source.type === "global" ? "global" : `auth:${source.hash}`,

    context: (response) => response.source,
  },

  fetchedAt: (response) => response.fetchedAt,

  ok: (response) => response.data.status === "ok",
};

function vercelKeyHash(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}
