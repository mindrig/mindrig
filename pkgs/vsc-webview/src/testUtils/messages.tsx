import { render, RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { MessagesProvider } from "../aspects/message/Context";
import { VscContext } from "../aspects/vsc/Context";

export interface MockVscApi {
  postMessage: ReturnType<typeof vi.fn>;
  getState: ReturnType<typeof vi.fn>;
  setState: ReturnType<typeof vi.fn>;
}

export function createMockVscApi(): MockVscApi {
  return {
    postMessage: vi.fn(),
    getState: vi.fn(() => ({})),
    setState: vi.fn(),
  };
}

export function renderWithVsc<T>(
  element: ReactElement,
  mock: MockVscApi,
): RenderResult {
  return render(
    <VscContext.Provider value={{ vsc: mock }}>
      <MessagesProvider>{element}</MessagesProvider>
    </VscContext.Provider>,
  );
}

export function postWindowMessage(type: string, payload?: unknown) {
  window.postMessage({ type, payload }, "*");
}

export function clearVscMocks(mock: MockVscApi) {
  mock.postMessage.mockClear();
  mock.getState.mockClear();
  mock.setState.mockClear();
}
