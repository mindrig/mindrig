import { GatewayProvider } from "@ai-sdk/gateway";
import { Auth, AuthGateway } from "@wrkspc/core/auth";
import {
  ModelGateway,
  ModelResponse,
  modelResponseErrorData,
  ModelVercel,
} from "@wrkspc/core/model";
import { log } from "smollog";
import { AuthManager } from "../auth/Manager.js";
import { resolveGateway } from "../gateway/gateway.js";
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

  #pendingFetch: Promise<void> | undefined;

  #refetch = new RequestRefreshManager(this, {
    ttl: ModelsGatewayManager.cacheTtl,
    provider: { fetch: () => this.#fetch(this.#auth.state.gateway) },
  });

  constructor(parent: Manager, props: ModelsGatewayManager.Props) {
    super(parent);

    this.#auth = props.auth;
    this.#secrets = props.secrets;
    this.#messages = props.messages;

    this.#auth.on(this, "gateway-resolve", this.#onAuthResolve);

    this.#messages.listen(this, "models-client-gateway-refresh", () =>
      this.#fetch(this.#auth.state.gateway),
    );
  }

  async #fetch(auth: Auth.GatewayValue) {
    if (this.#pendingFetch) return this.#pendingFetch;

    log.debug("Fetching gateway models", { auth: !!auth });

    this.#pendingFetch = (
      auth ? this.#fetchAuthScoped(auth) : this.#fetchGlobal()
    ).then(async (response) => {
      const ok = response.data.status === "ok";

      log.debug("Got gateway response", { ok });

      // Set up refetching
      this.#refetch.update(ok);

      // Cache response
      this.#cache(response.source.type).store(response);

      // Send models to webview
      this.#messages.send({
        type: "models-server-gateway-response",
        payload: response,
      });

      // Report status to auth
      if (auth)
        await this.#auth.registerGatewayResponse(
          response.data.status === "ok"
            ? auth
            : { ...auth, error: response.data.message },
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
    if (!apiKey) {
      log.error(
        "Requested auth-scoped Vercel gateway models, but no API key found",
      );
      return this.#fetchGlobal();
    }

    const source: ModelGateway.ListSource = {
      type: "auth",
      hash: await vercelKeyHash(apiKey),
    };

    const cache = this.#cache("auth").access(source);
    if (cache) {
      log.debug("Using cached Vercel gateway models for user key", source);
      return cache;
    }

    log.debug("Fetching Vercel gateway models with user key", source);

    const gateway = resolveGateway(apiKey);

    let data: ModelVercel.ListResponseData;
    try {
      const [credits, modelsResp] = await Promise.all([
        // TODO: This breaks the offline mode, we need to mock it properly.
        this.#fetchCredits(gateway),
        gateway.getAvailableModels(),
      ]);

      // We use credits presence as an indicator of valid key
      if (credits) {
        data = {
          status: "ok",
          payload: {
            models: modelsResp.models as ModelVercel.ApiModel[],
            credits,
          },
        };

        log.debug("Got authenticated Vercel gateway models", data);
      } else {
        data = {
          status: "error",
          message: "The provided Vercel AI Gateway key is invalid.",
        };
      }
    } catch (err) {
      data = this.#errorToData(err);
      log.debug("Failed to fetch authenticated Vercel gateway models", data);
    }

    return {
      type: "vercel",
      source,
      fetchedAt: Date.now(),
      data,
    };
  }

  async #fetchCredits(
    gateway: GatewayProvider,
  ): Promise<ModelVercel.Credits | null> {
    try {
      const credits = await gateway.getCredits();
      const { balance, totalUsed } = credits;
      return { balance, totalUsed };
    } catch (err) {
      return null;
    }
  }

  async #fetchGlobal(): Promise<ModelVercel.ListResponse> {
    const source: ModelGateway.ListSourceGlobal = { type: "global" };

    const cache = this.#cache("global").access(source);
    if (cache) {
      log.debug("Using cached global Vercel gateway models");
      return cache;
    }

    log.debug("Fetching global Vercel gateway models");

    // TODO: This was modeled with an assumption that Vercel Gateway throws
    // errors for invalid keys, but currently it does not. I'm not sure
    // if I gaslighted myself thinking that or it was the originl Gateway
    // behavior. Either way, we should figure out if that's by design or not.
    // If Vercel can confirm that getAvailableModels is guaranteed to be
    // accessible with invalid keys, then we can kill our gateway service
    // altogether.
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
        log.debug("Got global Vercel gateway models", data);
      } catch (err) {
        data = modelResponseErrorData(err);
        log.debug("Failed to parse global Vercel gateway models", data);
      }
    } else {
      data = modelResponseErrorData(
        `Failed to fetch models list: ${response.status} ${response.statusText}`,
      );
      log.debug("Failed to fetch global Vercel gateway models", data);
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

async function vercelKeyHash(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await global.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hash;
}
