import { act, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HashRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { AuthPage } from "@/app/Auth";
import { IndexPage } from "@/app/Index";
import { useGatewaySecretState } from "@/app/hooks/useGatewaySecretState";
import { SettingsContext } from "@/aspects/settings/Context";
import {
  clearVscMocks,
  createMockVscApi,
  postWindowMessage,
  renderWithVsc,
} from "@/testUtils/messages";

vi.mock("katex/dist/katex.min.css", () => ({}));

const navigationMocks = vi.hoisted(() => ({
  goBackOrIndex: vi.fn(),
  navigateTo: vi.fn(),
  replaceWith: vi.fn(),
}));

const routeState = vi.hoisted(() => ({
  currentRoute: "auth" as "auth" | "index",
}));

vi.mock("@/app/navigation", () => ({
  useAppNavigation: () => ({
    currentRoute: routeState.currentRoute,
    currentPath:
      routeState.currentRoute === "auth" ? ("/auth" as const) : ("/" as const),
    navigateTo: navigationMocks.navigateTo,
    replaceWith: navigationMocks.replaceWith,
    goBackOrIndex: navigationMocks.goBackOrIndex,
  }),
}));

let modelsContextHelpers: {
  setState: (
    partial: Partial<{
      keyStatus: KeyStatus;
      gatewayError: string | null;
      retry: ReturnType<typeof vi.fn>;
    }>,
  ) => void;
  resetState: () => void;
  getDefaultKeyStatus: () => KeyStatus;
};

type KeyStatus = {
  status: "idle" | "ok" | "error";
  message: string | null;
  source: "fallback" | "user";
  fallbackUsed: boolean;
  userAttempted: boolean;
  checkedAt?: number;
};

type ModelsContextModule = {
  __setModelsState: (
    partial: Partial<{
      keyStatus: KeyStatus;
      gatewayError: string | null;
      retry: ReturnType<typeof vi.fn>;
    }>,
  ) => void;
  __resetModelsState: () => void;
  __getDefaultKeyStatus: () => KeyStatus;
};

vi.mock("@/aspects/models/Context", () => {
  const React = require("react");
  const fallbackData: Record<string, any> = {};

  const createInitialState = () => ({
    keyStatus: getDefaultKeyStatus(),
    gatewayError: null as string | null,
    retry: vi.fn(),
  });

  let state = createInitialState();
  const listeners = new Set<() => void>();

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const notify = () => listeners.forEach((listener) => listener());

  const setState = (partial: Partial<typeof state>) => {
    state = { ...state, ...partial };
    notify();
  };

  const resetState = () => {
    state = createInitialState();
    notify();
  };

  const getSnapshot = () => state;

  const useModels = () => {
    const snapshot = React.useSyncExternalStore(
      subscribe,
      getSnapshot,
      getSnapshot,
    );

    return {
      gateway: undefined,
      gatewayModels: [],
      gatewayError: snapshot.gatewayError,
      dotDev: undefined,
      dotDevData: fallbackData,
      dotDevError: null,
      isDotDevFallback: false,
      isLoading: false,
      keyStatus: snapshot.keyStatus,
      retry: snapshot.retry,
      providers: {},
      modelsByProvider: {},
      getProvider: () => undefined,
      getModel: () => undefined,
      getCapabilities: () => ({
        supportsImages: false,
        supportsVideo: false,
        supportsFiles: false,
        supportsTools: false,
        supportsReasoning: false,
      }),
    };
  };

  return {
    useModels,
    __setModelsState: setState,
    __resetModelsState: resetState,
    __getDefaultKeyStatus: getDefaultKeyStatus,
  };
});

let modelsContext: ModelsContextModule;

beforeAll(async () => {
  modelsContext = (await import(
    "@/aspects/models/Context"
  )) as ModelsContextModule;
});

function AuthWithGatewayState() {
  const gatewayState = useGatewaySecretState();
  return <AuthPage gatewaySecretState={gatewayState} />;
}

describe("Auth route integration", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    modelsContext.__resetModelsState();
    modelsContext.__setModelsState({ retry: vi.fn() });
    navigationMocks.goBackOrIndex.mockClear();
    navigationMocks.navigateTo.mockClear();
    navigationMocks.replaceWith.mockClear();
    routeState.currentRoute = "auth";
  });

  test("shows auth form once gateway state resolves", async () => {
    const { mockVsc } = await renderAuthRoute();

    await dispatchGatewayState({
      maskedKey: null,
      hasKey: false,
      readOnly: false,
      isSaving: false,
    });

    const input = await screen.findByPlaceholderText(
      /enter your vercel gateway api key/i,
    );
    expect(input).toBeVisible();

    clearVscMocks(mockVsc);
  });

  test("submitting form posts auth-vercel-gateway-set and close triggers back navigation", async () => {
    const { mockVsc, user } = await renderAuthRoute();

    await dispatchGatewayState({
      maskedKey: null,
      hasKey: false,
      readOnly: false,
      isSaving: false,
    });

    const input = await screen.findByPlaceholderText(
      /enter your vercel gateway api key/i,
    );
    await user.type(input, "vercel_test_key");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(mockVsc.postMessage).toHaveBeenCalledWith({
      type: "auth-ext-vercel-gateway-set",
      payload: "vercel_test_key",
    });
    expect(mockVsc.postMessage).toHaveBeenCalledWith({
      type: "models-data-get",
    });

    const [headerClose] = screen.getAllByRole("button", { name: /close/i });
    await user.click(headerClose);

    await waitFor(() =>
      expect(navigationMocks.goBackOrIndex).toHaveBeenCalled(),
    );
  });

  test("auth-panel-open retriggers visibility once resolved", async () => {
    await renderAuthRoute();

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

    const input = await screen.findByPlaceholderText(
      /enter your vercel gateway api key/i,
    );
    expect(input).toBeVisible();
  });

  test("update button opens editable form even when gateway is read-only", async () => {
    const { user } = await renderAuthRoute();

    modelsContext.__setModelsState({
      keyStatus: {
        status: "ok",
        message: null,
        source: "user",
        fallbackUsed: false,
        userAttempted: true,
        checkedAt: Date.now(),
      },
    });

    await dispatchGatewayState({
      maskedKey: "abcd...12",
      hasKey: true,
      readOnly: true,
      isSaving: false,
    });

    const updateButton = await screen.findByRole("button", { name: /update/i });
    await user.click(updateButton);

    const input = await screen.findByPlaceholderText(
      /enter your vercel gateway api key/i,
    );
    expect(input).toBeVisible();
    expect(input).not.toBeDisabled();
    expect(input).toHaveValue("");
  });

  test("keeps form open and surfaces error when key validation fails", async () => {
    const { mockVsc, user } = await renderAuthRoute();

    await dispatchGatewayState({
      maskedKey: null,
      hasKey: false,
      readOnly: false,
      isSaving: false,
    });

    const input = await screen.findByPlaceholderText(
      /enter your vercel gateway api key/i,
    );
    await user.type(input, "123");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(mockVsc.postMessage).toHaveBeenCalledWith({
      type: "auth-ext-vercel-gateway-set",
      payload: "123",
    });
    expect(mockVsc.postMessage).toHaveBeenCalledWith({
      type: "models-data-get",
    });

    await dispatchGatewayState({
      maskedKey: "123",
      hasKey: true,
      readOnly: false,
      isSaving: true,
    });

    expect(screen.queryByRole("button", { name: /update/i })).toBeNull();

    modelsContext.__setModelsState({
      keyStatus: {
        status: "error",
        message: "Invalid key",
        source: "user",
        fallbackUsed: true,
        userAttempted: true,
        checkedAt: Date.now(),
      },
      gatewayError:
        "Failed to validate Vercel Gateway key. Please retry or update your credentials.",
    });

    await dispatchGatewayState({
      maskedKey: "123",
      hasKey: true,
      readOnly: false,
      isSaving: false,
    });

    await waitFor(() => expect(screen.getByText(/invalid key/i)).toBeVisible());

    expect(
      screen.getByPlaceholderText(/enter your vercel gateway api key/i),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: /update/i })).toBeNull();
    expect(navigationMocks.goBackOrIndex).not.toHaveBeenCalled();
  });

  test("renders inline error when an invalid key is already stored", async () => {
    await renderAuthRoute();

    modelsContext.__setModelsState({
      keyStatus: {
        status: "error",
        message: "Invalid key",
        source: "user",
        fallbackUsed: true,
        userAttempted: true,
        checkedAt: Date.now(),
      },
      gatewayError: "Invalid key",
    });

    await dispatchGatewayState({
      maskedKey: "abcd...12",
      hasKey: true,
      readOnly: false,
      isSaving: false,
    });

    const input = await screen.findByPlaceholderText(
      /enter your vercel gateway api key/i,
    );
    expect(input).toBeVisible();
    expect(screen.getByText(/invalid key/i)).toBeVisible();
    expect(screen.queryByRole("button", { name: /update/i })).toBeNull();
  });
});

describe("Index gateway warnings", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    modelsContext.__resetModelsState();
    navigationMocks.goBackOrIndex.mockClear();
    routeState.currentRoute = "index";
  });

  test("shows error banner when gateway key is invalid on load", async () => {
    routeState.currentRoute = "index";
    modelsContext.__setModelsState({
      keyStatus: {
        status: "error",
        message:
          "Failed to validate Vercel Gateway key. Please retry or update your credentials.",
        source: "user",
        fallbackUsed: false,
        userAttempted: true,
        checkedAt: Date.now(),
      },
      gatewayError:
        "Failed to validate Vercel Gateway key. Please retry or update your credentials.",
    });

    const mockVsc = createMockVscApi();
    window.location.hash = "#/";

    renderWithVsc(
      <SettingsContext.Provider
        value={{ settings: { playground: { showSource: false } } }}
      >
        <HashRouter hashType="slash">
          <IndexPage
            gatewaySecretState={{
              maskedKey: "abcd...12",
              hasKey: true,
              isResolved: true,
              readOnly: false,
              isSaving: false,
            }}
          />
        </HashRouter>
      </SettingsContext.Provider>,
      mockVsc,
    );

    await waitFor(() =>
      expect(screen.getByText(/vercel gateway error/i)).toBeVisible(),
    );
    expect(
      screen.getByText(/failed to validate vercel gateway key/i),
    ).toBeVisible();
  });

  test("shows missing key warning when no key is configured", async () => {
    routeState.currentRoute = "index";
    modelsContext.__setModelsState({
      keyStatus: {
        status: "ok",
        message: null,
        source: "fallback",
        fallbackUsed: true,
        userAttempted: false,
        checkedAt: Date.now(),
      },
    });

    const mockVsc = createMockVscApi();
    window.location.hash = "#/";

    renderWithVsc(
      <SettingsContext.Provider
        value={{ settings: { playground: { showSource: false } } }}
      >
        <HashRouter hashType="slash">
          <IndexPage
            gatewaySecretState={{
              maskedKey: null,
              hasKey: false,
              isResolved: true,
              readOnly: false,
              isSaving: false,
            }}
          />
        </HashRouter>
      </SettingsContext.Provider>,
      mockVsc,
    );

    await waitFor(() =>
      expect(screen.getByText(/vercel gateway key missing/i)).toBeVisible(),
    );
    expect(
      screen.getByText(/you are not authenticated with vercel gateway/i),
    ).toBeVisible();
    expect(screen.queryByText(/vercel gateway error/i)).toBeNull();
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

async function renderAuthRoute() {
  const mockVsc = createMockVscApi();
  const user = userEvent.setup();

  renderWithVsc(
    <SettingsContext.Provider
      value={{ settings: { playground: { showSource: false } } }}
    >
      <AuthWithGatewayState />
    </SettingsContext.Provider>,
    mockVsc,
  );

  await waitFor(() =>
    expect(mockVsc.postMessage).toHaveBeenCalledWith({
      type: "lifecycle-wv-ready",
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
