import { describe, expect, it, vi } from "vitest";
import { renderHook, render } from "@testing-library/react";
import type { FC, PropsWithChildren } from "react";
import type { VscMessage } from "@wrkspc/vsc-message";
import {
  MessageProvider,
  useMessage,
  useOn,
  useOnce,
} from "./messageContext";
import { VscContext } from "@/aspects/vsc/Context";
import { createMockVSCodeAPI } from "@/__tests__/mocks/vscode";

function createWrapper(mock = createMockVSCodeAPI()) {
  const Wrapper: FC<PropsWithChildren> = ({ children }) => (
    <VscContext.Provider value={{ vsc: mock }}>
      <MessageProvider>{children}</MessageProvider>
    </VscContext.Provider>
  );

  return { Wrapper, mock };
}

describe("message context", () => {
  it("sends messages through vscode API", () => {
    const { Wrapper, mock } = createWrapper();

    const { result } = renderHook(() => useMessage(), { wrapper: Wrapper });

    const message: VscMessage = { type: "settings-streaming-get" };
    result.current.send(message);

    expect(mock.postMessage).toHaveBeenCalledWith(message);
  });

  it("delivers inbound messages to registered handlers", () => {
    const { Wrapper } = createWrapper();
    const handler = vi.fn();

    const { unmount } = renderHook(() => {
      useOn("settings-streaming-state", handler, [handler]);
    }, { wrapper: Wrapper });

    const inbound: VscMessage = {
      type: "settings-streaming-state",
      payload: { enabled: true },
    };

    window.dispatchEvent(new MessageEvent("message", { data: inbound }));
    expect(handler).toHaveBeenCalledWith(inbound);

    // Ensure cleanup removes listeners
    unmount();
    handler.mockClear();
    window.dispatchEvent(new MessageEvent("message", { data: inbound }));
    expect(handler).not.toHaveBeenCalled();
  });

  it("only fires once for once subscriptions", () => {
    const { Wrapper } = createWrapper();
    const handler = vi.fn();

    renderHook(() => {
      useOnce("settings-streaming-state", handler, [handler]);
    }, { wrapper: Wrapper });

    const inbound: VscMessage = {
      type: "settings-streaming-state",
      payload: { enabled: false },
    };

    window.dispatchEvent(new MessageEvent("message", { data: inbound }));
    window.dispatchEvent(new MessageEvent("message", { data: inbound }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("subscribes via useOn and cleans up on unmount", () => {
    const { Wrapper } = createWrapper();
    const handler = vi.fn();

    function Subscriber() {
      useOn("settings-streaming-state", handler, []);
      return null;
    }

    const { unmount } = render(
      <Wrapper>
        <Subscriber />
      </Wrapper>,
    );

    const inbound: VscMessage = {
      type: "settings-streaming-state",
      payload: { enabled: true },
    };

    window.dispatchEvent(new MessageEvent("message", { data: inbound }));
    expect(handler).toHaveBeenCalledTimes(1);

    handler.mockClear();
    unmount();

    window.dispatchEvent(new MessageEvent("message", { data: inbound }));
    expect(handler).not.toHaveBeenCalled();
  });

  it("handles one-time subscriptions with useOnce", () => {
    const { Wrapper } = createWrapper();
    const handler = vi.fn();

    function Subscriber() {
      useOnce("settings-streaming-state", handler, []);
      return null;
    }

    render(
      <Wrapper>
        <Subscriber />
      </Wrapper>,
    );

    const inbound: VscMessage = {
      type: "settings-streaming-state",
      payload: { enabled: false },
    };

    window.dispatchEvent(new MessageEvent("message", { data: inbound }));
    window.dispatchEvent(new MessageEvent("message", { data: inbound }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("resolves the once promise helper", async () => {
    const { Wrapper } = createWrapper();

    const messagePromise = renderHook(() => useMessage(), {
      wrapper: Wrapper,
    }).result.current.once("settings-streaming-state");

    const inbound: VscMessage = {
      type: "settings-streaming-state",
      payload: { enabled: true },
    };

    window.dispatchEvent(new MessageEvent("message", { data: inbound }));

    await expect(messagePromise).resolves.toEqual(inbound);
  });
});
