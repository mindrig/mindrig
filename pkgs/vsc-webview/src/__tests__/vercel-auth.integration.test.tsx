import { Index } from "@/app/Index";
import { SettingsContext } from "@/aspects/settings/Context";
import {
  createMockVscApi,
  postWindowMessage,
  renderWithVsc,
} from "@/testUtils/messages";
import { act, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("katex/dist/katex.min.css", () => ({}));

type KeyStatus = {
  status: "idle" | "ok" | "error";
  message: string | null;
  source: "fallback" | "user";
  fallbackUsed: boolean;
  userAttempted: boolean;
  checkedAt?: number;
};

interface ModelsStubState {
  keyStatus: KeyStatus;
  gatewayError: string | null;
  retry: ReturnType<typeof vi.fn>;
}

const modelsStubState: ModelsStubState = {
  keyStatus: getDefaultKeyStatus(),
  gatewayError: null,
  retry: vi.fn(),
};

vi.mock("@/aspects/models/Context", () => {
  const fallbackData: Record<string, any> = {
    openai: {
      id: "openai",
      name: "OpenAI",
      models: {
        "gpt-5": { name: "GPT-5", last_updated: "2025-01-01T00:00:00Z" },
        "gpt-5-mini": {
          name: "GPT-5 Mini",
          last_updated: "2025-01-01T00:00:00Z",
        },
      },
    },
  };

  const providers: Record<string, any> = {
    openai: {
      id: "openai",
      name: "OpenAI",
      models: fallbackData.openai.models,
    },
  };

  const modelsByProvider: Record<string, Record<string, any>> = {
    openai: {
      "gpt-5": { id: "gpt-5", name: "GPT-5" },
      "gpt-5-mini": { id: "gpt-5-mini", name: "GPT-5 Mini" },
    },
  };

  const normalise = (value: string | null | undefined) =>
    (value ?? "").toLowerCase();

  const stub = {
    gateway: undefined,
    gatewayModels: [],
    gatewayError: null,
    dotDev: { status: "ok", data: fallbackData } as const,
    dotDevData: fallbackData,
    dotDevError: null,
    isDotDevFallback: true,
    isLoading: false,
    providers,
    modelsByProvider,
    getProvider: (providerId: string | null | undefined) =>
      providers[normalise(providerId)],
    getModel: (
      providerId: string | null | undefined,
      modelId: string | null | undefined,
    ) => {
      const providerKey = normalise(providerId);
      const modelKey = normalise(modelId);
      return modelsByProvider[providerKey]?.[modelKey];
    },
    getCapabilities: () => ({
      supportsImages: false,
      supportsVideo: false,
      supportsFiles: false,
      supportsTools: false,
      supportsReasoning: false,
    }),
  } as const;

  return {
    useModels: () => ({
      ...stub,
      keyStatus: modelsStubState.keyStatus,
      gatewayError: modelsStubState.gatewayError,
      retry: modelsStubState.retry,
    }),
  };
});

describe("vercel auth integration", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    modelsStubState.keyStatus = getDefaultKeyStatus();
    modelsStubState.gatewayError = null;
    modelsStubState.retry = vi.fn();
  });

  test("keeps auth UI hidden until state resolves and remains hidden until requested", async () => {
    const { mockVsc } = await renderWorkbench();

    expect(screen.queryByText(/vercel gateway api key/i)).toBeNull();

    await dispatchGatewayState({
      maskedKey: null,
      hasKey: false,
      readOnly: false,
      isSaving: false,
    });

    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText(/enter your vercel gateway api key/i),
      ).toBeNull(),
    );

    expect(mockVsc.postMessage).not.toHaveBeenCalledWith({
      type: "auth-vercel-gateway-set",
      payload: expect.any(String),
    });
  });

  test("opens on request and hides after successful verification", async () => {
    const { mockVsc, user } = await renderWorkbench();

    await dispatchGatewayState({
      maskedKey: null,
      hasKey: false,
      readOnly: false,
      isSaving: false,
    });

    await dispatchPanelOpen();

    const input = await screen.findByPlaceholderText(
      /enter your vercel gateway api key/i,
    );

    await user.type(input, "vercel_test_key");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(mockVsc.postMessage).toHaveBeenCalledWith({
      type: "auth-vercel-gateway-set",
      payload: "vercel_test_key",
    });

    await dispatchGatewayState({
      maskedKey: "verc...23",
      hasKey: true,
      readOnly: false,
      isSaving: false,
    });

    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText(/enter your vercel gateway api key/i),
      ).toBeNull(),
    );
  });

  test("honours pending open requests once state resolves", async () => {
    await renderWorkbench();

    await dispatchPanelOpen();

    expect(
      screen.queryByPlaceholderText(/enter your vercel gateway api key/i),
    ).toBeNull();

    await dispatchGatewayState({
      maskedKey: null,
      hasKey: false,
      readOnly: false,
      isSaving: false,
    });

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText(/enter your vercel gateway api key/i),
      ).toBeVisible(),
    );
  });

  test("shows profile summary for logged-in users until closed", async () => {
    const { user } = await renderWorkbench();

    await dispatchGatewayState({
      maskedKey: "abcd...12",
      hasKey: true,
      readOnly: false,
      isSaving: false,
    });

    expect(screen.queryByText("abcd...12")).toBeNull();

    await dispatchPanelOpen();

    expect(await screen.findByText("abcd...12")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => expect(screen.queryByText("abcd...12")).toBeNull());
  });

  test("clearing from masked view switches to form", async () => {
    const { mockVsc, user } = await renderWorkbench();

    await dispatchGatewayState({
      maskedKey: "abcd...12",
      hasKey: true,
      readOnly: false,
      isSaving: false,
    });

    await dispatchPanelOpen();

    expect(await screen.findByText("abcd...12")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(mockVsc.postMessage).toHaveBeenCalledWith({
      type: "auth-vercel-gateway-clear",
    });

    const input = await screen.findByPlaceholderText(
      /enter your vercel gateway api key/i,
    );
    expect(input).toBeVisible();

    await dispatchGatewayState({
      maskedKey: null,
      hasKey: false,
      readOnly: false,
      isSaving: false,
    });

    expect(
      screen.getByPlaceholderText(/enter your vercel gateway api key/i),
    ).toBeVisible();
  });
});

function getDefaultKeyStatus(): KeyStatus {
  return {
    status: "idle",
    message: null,
    source: "fallback",
    fallbackUsed: false,
    userAttempted: false,
  };
}

async function renderWorkbench() {
  const mockVsc = createMockVscApi();
  const user = userEvent.setup();

  renderWithVsc(
    <SettingsContext.Provider
      value={{ settings: { playground: { showSource: false } } }}
    >
      <Index />
    </SettingsContext.Provider>,
    mockVsc,
  );

  await waitFor(() =>
    expect(mockVsc.postMessage).toHaveBeenCalledWith({
      type: "lifecycle-webview-ready",
    }),
  );

  return { mockVsc, user };
}

async function dispatchGatewayState(payload: {
  maskedKey: string | null;
  hasKey: boolean;
  readOnly: boolean;
  isSaving: boolean;
}) {
  await act(async () => {
    postWindowMessage("auth-vercel-gateway-state", payload);
  });
}

async function dispatchPanelOpen() {
  await act(async () => {
    postWindowMessage("auth-panel-open");
  });
}
