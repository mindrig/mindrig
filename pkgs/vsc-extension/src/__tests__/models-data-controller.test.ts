import { describe, expect, it, vi, beforeEach } from "vitest";
import type { VscMessage } from "@wrkspc/vsc-message";
import type { VscMessageBus } from "@/aspects/message";
import type { SecretManager } from "../SecretManager";
import { ModelsDataController } from "../ModelsDataController";
import { createGateway } from "@ai-sdk/gateway";

vi.mock("@ai-sdk/gateway", () => ({
  createGateway: vi.fn(),
}));

const sampleGatewayResponse = {
  models: [
    {
      id: "openai/gpt-5" as const,
      name: "GPT-5",
      modelType: "language",
      specification: { provider: "openai" },
      pricing: { input: "1", output: "2" },
    },
  ],
};

const sampleFallbackResponse = {
  models: [
    {
      id: "openai/gpt-5-mini" as const,
      name: "GPT-5 Mini",
      modelType: "language",
      specification: { provider: "openai" },
      pricing: { input: 1, output: 2 },
    },
  ],
};

class StubMessageBus implements Pick<VscMessageBus, "on" | "send"> {
  public sent: VscMessage[] = [];
  private handlers = new Map<string, Set<(message: VscMessage) => void>>();

  on(type: VscMessage["type"], handler: (message: VscMessage) => void) {
    const bucket = this.handlers.get(type) ?? new Set();
    bucket.add(handler);
    this.handlers.set(type, bucket);
    return {
      dispose: () => bucket.delete(handler),
    };
  }

  async send(message: VscMessage) {
    this.sent.push(message);
  }

  emit(message: VscMessage) {
    const listeners = this.handlers.get(message.type);
    listeners?.forEach((handler) => handler(message));
  }

  clear() {
    this.sent = [];
  }
}

class StubSecretManager implements Pick<SecretManager, "getSecret"> {
  #secret: string | null;

  constructor(initial: string | null) {
    this.#secret = initial;
  }

  async getSecret() {
    return this.#secret ?? undefined;
  }
}

describe("ModelsDataController", () => {
  const gatewayMock = createGateway as unknown as vi.Mock;
  const gatewayOrigin = "https://example.com";
  let messageBus: StubMessageBus;

  beforeEach(() => {
    vi.resetAllMocks();
    messageBus = new StubMessageBus();
  });

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  async function createController(options?: {
    secret?: string | null;
    fetchImpl?: typeof fetch;
  }) {
    const controller = new ModelsDataController({
      messageBus: messageBus as unknown as VscMessageBus,
      secretManager: new StubSecretManager(options?.secret ?? null),
      gatewayOrigin,
      fetchImpl: options?.fetchImpl ?? (async () => ({
            ok: true,
            json: async () => sampleFallbackResponse,
          })) ,
    });

    return controller;
  }

  function findMessages(type: VscMessage["type"]) {
    return messageBus.sent.filter((msg) => msg.type === type);
  }

  it("emits gateway data with user source when secret succeeds", async () => {
    gatewayMock.mockReturnValue({
      getAvailableModels: vi.fn().mockResolvedValue(sampleGatewayResponse),
    } as any);

    const controller = await createController({ secret: "sk-token" });

    await controller.refresh();
    await flush();

    const [dataResponse] = findMessages("models-data-response");
    const statusMessages = findMessages("auth-vercel-gateway-status");
    const statusMessage = statusMessages.at(-1);

    expect(dataResponse).toBeTruthy();
    expect(dataResponse?.payload.gateway?.source).toBe("user");
    expect(dataResponse?.payload.gateway?.response.status).toBe("ok");
    expect(statusMessage?.payload.status).toBe("ok");
    expect(statusMessage?.payload.userAttempted).toBe(true);
  });

  it("falls back to wrapper and reports key error when user fetch fails", async () => {
    const error = new Error("401 Unauthorized");
    gatewayMock.mockReturnValue({
      getAvailableModels: vi.fn().mockRejectedValue(error),
    } as any);

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleFallbackResponse,
    });

    const controller = await createController({
      secret: "sk-token",
      fetchImpl,
    });

    await controller.refresh({ force: true });
    await flush();

    const [dataResponse] = findMessages("models-data-response");
    const statusMessages = findMessages("auth-vercel-gateway-status");
    const statusMessage = statusMessages.at(-1);

    expect(dataResponse?.payload.gateway?.source).toBe("fallback");
    expect(dataResponse?.payload.gateway?.response.status).toBe("ok");
    expect(statusMessage?.payload.status).toBe("error");
    expect(statusMessage?.payload.userAttempted).toBe(true);
    expect(statusMessage?.payload.source).toBe("fallback");
    expect(statusMessage?.payload.message).toContain("401");
  });

  it("uses public fallback without user attempt when no secret is stored", async () => {
    gatewayMock.mockReset();

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleFallbackResponse,
    });

    const controller = await createController({
      secret: null,
      fetchImpl,
    });

    await controller.refresh();
    await flush();

    const [dataResponse] = findMessages("models-data-response");
    const statusMessages = findMessages("auth-vercel-gateway-status");
    const statusMessage = statusMessages.at(-1);

    expect(gatewayMock).not.toHaveBeenCalled();
    expect(dataResponse?.payload.gateway?.source).toBe("fallback");
    expect(statusMessage?.payload.status).toBe("ok");
    expect(statusMessage?.payload.userAttempted).toBe(false);
  });

  it("reuses cached fallback models when wrapper later fails without a user key", async () => {
    gatewayMock.mockReset();

    let fallbackCallCount = 0;
    const fetchImpl = vi.fn(async (input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === "string" ? input : (input as Request)?.url ?? String(input);
      if (url.includes("/vercel/models")) {
        if (fallbackCallCount === 0) {
          fallbackCallCount += 1;
          return {
            ok: true,
            json: async () => sampleFallbackResponse,
          } as any;
        }
        fallbackCallCount += 1;
        return {
          ok: false,
          status: 500,
          json: async () => ({}),
        } as any;
      }

      return {
        ok: true,
        json: async () => ({ providers: {} }),
      } as any;
    });

    const controller = await createController({ secret: null, fetchImpl });

    await controller.refresh({ force: true });
    await flush();
    messageBus.clear();

    await controller.refresh({ force: true });
    await flush();

    const dataResponses = findMessages("models-data-response");
    const dataResponse = dataResponses.at(-1);
    const statusMessages = findMessages("auth-vercel-gateway-status");
    const statusMessage = statusMessages.at(-1);

    const fallbackCalls = fetchImpl.mock.calls.filter(([input]) =>
      (typeof input === "string" ? input : (input as Request)?.url ?? String(input)).includes(
        "/vercel/models",
      ),
    );
    expect(fallbackCalls).toHaveLength(2);
    expect(dataResponse?.payload.gateway?.response.status).toBe("ok");
    expect(statusMessage?.payload.status).toBe("ok");
    expect(statusMessage?.payload.userAttempted).toBe(false);
    expect(statusMessage?.payload.fallbackUsed).toBe(true);
  });
});
