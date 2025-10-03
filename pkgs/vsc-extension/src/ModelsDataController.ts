import { createGateway } from "@ai-sdk/gateway";
import { VscController } from "@wrkspc/vsc-controller";
import type { ModelDotdev, ModelGateway, ModelVercel } from "@wrkspc/model";
import type { VscMessageAuth, VscMessageModels } from "@wrkspc/vsc-message";

import type { VscMessageBus } from "@/aspects/message";
import type { SecretManager } from "./SecretManager";

const MODELS_DEV_ENDPOINT = "https://models.dev/api.json";
const MODELS_DEV_TTL_MS = 5 * 60 * 1000; // 5 minutes
const GATEWAY_TTL_MS = 60 * 1000; // 1 minute

type ModelsDevResponseMessage = Extract<
  VscMessageModels,
  { type: "models-dev-response" }
>;

type ModelsDataResponseMessage = Extract<
  VscMessageModels,
  { type: "models-data-response" }
>;

type GatewayKeyStatusMessage = Extract<
  VscMessageAuth,
  { type: "auth-vercel-gateway-status" }
>;

export interface ModelsDataControllerOptions {
  messageBus: VscMessageBus;
  secretManager: SecretManager;
  gatewayOrigin: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

interface ModelsDevState {
  payload: ModelDotdev.Response | undefined;
  fetchedAt: number | null;
}

export class ModelsDataController extends VscController {
  readonly #messageBus: VscMessageBus;
  readonly #secretManager: SecretManager;
  readonly #gatewayOrigin: string;
  readonly #fetch: typeof fetch;
  readonly #now: () => number;

  #modelsDevState: ModelsDevState = {
    payload: undefined,
    fetchedAt: null,
  };
  #modelsDevInflight: Promise<ModelDotdev.Response | undefined> | null = null;

  #gatewayCache: ModelGateway.Response | undefined;
  #gatewayInflight: Promise<ModelGateway.Response> | null = null;
  #lastGatewayError: string | null = null;
  #lastUserAttempted = false;
  #lastKeyStatus: GatewayKeyStatusMessage["payload"] = {
    status: "idle",
    source: "fallback",
    fallbackUsed: false,
    userAttempted: false,
  };

  constructor(options: ModelsDataControllerOptions) {
    super();

    this.#messageBus = options.messageBus;
    this.#secretManager = options.secretManager;
    this.#gatewayOrigin = options.gatewayOrigin;
    this.#fetch = options.fetchImpl ?? fetch;
    this.#now = options.now ?? Date.now;

    this.register(
      this.#messageBus.on("models-data-get", () => {
        void this.refresh();
      }),
    );

    // Legacy handler until the webview migrates to models-data.
    this.register(
      this.#messageBus.on("models-dev-get", () => {
        void this.#sendLegacyModelsDev();
      }),
    );

    void this.#messageBus.send({
      type: "auth-vercel-gateway-status",
      payload: this.#lastKeyStatus,
    });
  }

  async refresh({ force }: { force?: boolean } = {}) {
    const gatewayPromise = this.#fetchGateway(
      force ? { force: true } : undefined,
    );
    const modelsDevPromise = this.#fetchModelsDev(
      force ? { force: true } : undefined,
    );

    await Promise.all([gatewayPromise, modelsDevPromise]);

    await this.#emitCombinedResponse();
  }

  async handleSecretChanged() {
    this.#gatewayCache = undefined;
    this.#lastGatewayError = null;
    await this.refresh({ force: true });
  }

  async #fetchModelsDev(options?: { force?: boolean }) {
    const force = options?.force === true;
    const now = this.#now();
    if (!force && this.#modelsDevState.fetchedAt) {
      const age = now - this.#modelsDevState.fetchedAt;
      if (age < MODELS_DEV_TTL_MS) return this.#modelsDevState.payload;
    }

    if (this.#modelsDevInflight) return this.#modelsDevInflight;

    this.#modelsDevInflight = this.#requestModelsDev()
      .then((response) => {
        this.#modelsDevInflight = null;
        this.#modelsDevState = {
          payload: response,
          fetchedAt: now,
        };
        return response;
      });

    return this.#modelsDevInflight;
  }

  async #requestModelsDev(): Promise<ModelDotdev.Response> {
    try {
      const response = await this.#fetch(MODELS_DEV_ENDPOINT);
      if (!response.ok)
        throw new Error(`models.dev request failed with HTTP ${response.status}`);

      const data = (await response.json()) as ModelDotdev.Data;
      return { status: "ok", data } satisfies ModelDotdev.Response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? "Unknown");
      return { status: "error", message } satisfies ModelDotdev.Response;
    }
  }

  async #fetchGateway(options?: { force?: boolean }) {
    const force = options?.force === true;
    const now = this.#now();
    if (!force && this.#gatewayCache) {
      const age = now - this.#gatewayCache.fetchedAt;
      if (age < GATEWAY_TTL_MS) return this.#gatewayCache;
    }

    if (this.#gatewayInflight) return this.#gatewayInflight;

    this.#gatewayInflight = this.#requestGateway()
      .then((response) => {
        this.#gatewayInflight = null;
        this.#gatewayCache = response;
        return response;
      })
      .catch((error) => {
        this.#gatewayInflight = null;
        const message =
          error instanceof Error ? error.message : String(error ?? "Unknown");
        this.#lastGatewayError = message;
        const fallbackResponse: ModelGateway.Response = {
          type: "vercel",
          source: "fallback",
          fetchedAt: now,
          response: { status: "error", message },
        };
        this.#gatewayCache = fallbackResponse;
        return fallbackResponse;
      })
      .finally(() => {
        void this.#broadcastKeyStatus();
      });

    return this.#gatewayInflight;
  }

  async #requestGateway(): Promise<ModelGateway.Response> {
    const now = this.#now();
    const secret = await this.#secretManager.getSecret();
    this.#lastUserAttempted = !!secret;

    if (secret) {
      try {
        const gateway = createGateway({ apiKey: secret });
        const response = await gateway.getAvailableModels();
        const normalized = this.#normalizeGatewayResponse(response);
        this.#lastGatewayError = null;
        const payload: ModelGateway.Response = {
          type: "vercel",
          source: "user",
          fetchedAt: now,
          response: { status: "ok", data: normalized },
        };
        return payload;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error ?? "Unknown");
        this.#lastGatewayError = message;
      }
    } else {
      this.#lastGatewayError = null;
    }

    const wrapperResponse = await this.#fetch(
      `${this.#gatewayOrigin}/vercel/models`,
    );
    if (!wrapperResponse.ok) {
      throw new Error(`Gateway wrapper failed with HTTP ${wrapperResponse.status}`);
    }

    const fallbackRaw = await wrapperResponse.json();
    const fallbackData = this.#normalizeGatewayResponse(fallbackRaw);
    const payload: ModelGateway.Response = {
      type: "vercel",
      source: "fallback",
      fetchedAt: now,
      response: { status: "ok", data: fallbackData },
    };
    return payload;
  }

  async #sendLegacyModelsDev() {
    try {
      const response = await this.#fetchModelsDev();
      if (response?.status === "ok") {
        const payload: ModelsDevResponseMessage = {
          type: "models-dev-response",
          payload: {
            status: "ok",
            data: response.data as unknown as ModelDotdev.Response,
          },
        };
        await this.#messageBus.send(payload);
        return;
      }

      const errorMessage =
        response?.status === "error"
          ? response.message
          : "Unknown models.dev error";
      console.error("Failed to fetch models.dev data:", errorMessage);
      const failure: ModelsDevResponseMessage = {
        type: "models-dev-response",
        payload: {
          status: "error",
          error: errorMessage,
        },
      };
      await this.#messageBus.send(failure);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? "Unknown");
      console.error("Unhandled models.dev fetch error:", message);
      const failure: ModelsDevResponseMessage = {
        type: "models-dev-response",
        payload: {
          status: "error",
          error: message,
        },
      };
      await this.#messageBus.send(failure);
    }
  }

  async #emitCombinedResponse() {
    const payload: ModelsDataResponseMessage = {
      type: "models-data-response",
      payload: {
        gateway: this.#gatewayCache,
        dotDev: this.#modelsDevState.payload,
      },
    };
    await this.#messageBus.send(payload);
  }

  async #broadcastKeyStatus() {
    const fetchedAt = this.#gatewayCache?.fetchedAt ?? this.#now();
    const gatewayResponse = this.#gatewayCache?.response;
    const hasGatewayError = gatewayResponse?.status === "error";
    const status = this.#lastGatewayError || hasGatewayError ? "error" : "ok";
    const message =
      this.#lastGatewayError || (hasGatewayError ? gatewayResponse.message : undefined);
    const fallbackUsed = this.#gatewayCache?.source === "fallback";
    const source =
      this.#gatewayCache?.source ?? (this.#lastUserAttempted ? "user" : "fallback");

    const payloadData: GatewayKeyStatusMessage["payload"] = {
      status,
      checkedAt: fetchedAt,
      source,
      fallbackUsed,
      userAttempted: this.#lastUserAttempted,
      ...(message ? { message } : {}),
    };

    this.#lastKeyStatus = payloadData;

    const packet: GatewayKeyStatusMessage = {
      type: "auth-vercel-gateway-status",
      payload: payloadData,
    };

    await this.#messageBus.send(packet);
  }

  getLastGatewayStatus(): GatewayKeyStatusMessage["payload"] {
    return this.#lastKeyStatus;
  }

  #normalizeGatewayResponse(raw: unknown): ModelVercel.Data {
    const modelsArray = Array.isArray((raw as any)?.models)
      ? ((raw as any).models as any[])
      : [];

    const models = modelsArray.map((model) => ({
      ...model,
      id: String(model?.id ?? "") as ModelVercel.ModelId,
    }));

    return { models } satisfies ModelVercel.Data;
  }
}
