import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Disposable, Webview } from "vscode";
import type { VscMessage } from "@wrkspc/vsc-message";

import { VscMessageBus } from "./vscMessageBus";

interface MockWebview extends Webview {
  __listeners: Array<(message: unknown) => void>;
}

function createWebviewMock(): MockWebview {
  const listeners: Array<(message: unknown) => void> = [];

  return {
    __listeners: listeners,
    postMessage: vi.fn().mockResolvedValue(true),
    onDidReceiveMessage: vi
      .fn<(callback: (message: unknown) => void) => Disposable>()
      .mockImplementation((callback) => {
        listeners.push(callback);
        return {
          dispose: vi.fn(() => {
            const index = listeners.indexOf(callback);
            if (index >= 0) listeners.splice(index, 1);
          }),
        };
      }),
  } as unknown as MockWebview;
}

describe("VscMessageBus", () => {
  let webview: MockWebview;

  beforeEach(() => {
    webview = createWebviewMock();
    vi.clearAllMocks();
  });

  it("forwards messages via postMessage", async () => {
    const bus = new VscMessageBus(webview);
    const message: VscMessage = { type: "auth-vercel-gateway-get" };

    await bus.send(message);

    expect(webview.postMessage).toHaveBeenCalledWith(message);
  });

  it("routes messages to scoped handlers", () => {
    const bus = new VscMessageBus(webview);
    const handler = vi.fn();

    bus.on("auth-vercel-gateway-state", handler);

    const inbound: VscMessage = {
      type: "auth-vercel-gateway-state",
      payload: {
        maskedKey: "token",
        hasKey: true,
        readOnly: true,
        isSaving: false,
      },
    };

    webview.__listeners.forEach((listener) => listener(inbound));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(inbound);
  });

  it("supports once subscriptions", () => {
    const bus = new VscMessageBus(webview);
    const handler = vi.fn();

    bus.once("auth-vercel-gateway-state", handler);

    const first: VscMessage = {
      type: "auth-vercel-gateway-state",
      payload: {
        maskedKey: "secret",
        hasKey: true,
        readOnly: true,
        isSaving: false,
      },
    };
    const second: VscMessage = {
      type: "auth-vercel-gateway-state",
      payload: {
        maskedKey: null,
        hasKey: false,
        readOnly: false,
        isSaving: false,
      },
    };

    webview.__listeners.forEach((listener) => listener(first));
    webview.__listeners.forEach((listener) => listener(second));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(first);
  });

  it("disposes handlers", () => {
    const bus = new VscMessageBus(webview);
    const handler = vi.fn();

    const disposable = bus.on("auth-vercel-gateway-state", handler);
    disposable.dispose();

    const inbound: VscMessage = {
      type: "auth-vercel-gateway-state",
      payload: {
        maskedKey: "token",
        hasKey: true,
        readOnly: true,
        isSaving: false,
      },
    };

    webview.__listeners.forEach((listener) => listener(inbound));
    expect(handler).not.toHaveBeenCalled();
  });

  it("reports unhandled payloads when debug is enabled", () => {
    const onUnhandledMessage = vi.fn();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const bus = new VscMessageBus(webview, {
      debug: true,
      onUnhandledMessage,
    });

    webview.__listeners.forEach((listener) => listener(null));

    expect(onUnhandledMessage).toHaveBeenCalledWith(null);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("logs inbound and outbound messages when a logger is provided", async () => {
    const logger = vi.fn();
    const bus = new VscMessageBus(webview, { logger });

    const outbound: VscMessage = { type: "auth-vercel-gateway-get" };
    await bus.send(outbound);

    expect(logger).toHaveBeenCalledWith({
      direction: "out",
      message: outbound,
    });

    const inbound: VscMessage = {
      type: "auth-vercel-gateway-state",
      payload: {
        maskedKey: "token",
        hasKey: true,
        readOnly: true,
        isSaving: false,
      },
    };

    webview.__listeners.forEach((listener) => listener(inbound));

    expect(logger).toHaveBeenCalledWith({ direction: "in", message: inbound });
  });
});
