import { expect, vi } from "vitest";

export interface MockVSCodeAPI {
  postMessage: ReturnType<typeof vi.fn>;
  getState: ReturnType<typeof vi.fn>;
  setState: ReturnType<typeof vi.fn>;
}

export function createMockVSCodeAPI(): MockVSCodeAPI {
  const mockAPI = {
    postMessage: vi.fn(),
    getState: vi.fn(() => ({})),
    setState: vi.fn(),
  };

  return mockAPI;
}

export function createMockSyncMessage(type: string, payload?: any) {
  return {
    type,
    payload,
    timestamp: Date.now(),
  };
}

export function createMockSyncMessageUpdate(updateArray: number[]) {
  return createMockSyncMessage("sync-update", {
    update: updateArray,
  });
}

export function createMockSyncMessageStateVector(stateVectorArray: number[]) {
  return createMockSyncMessage("sync-state-vector", {
    stateVector: stateVectorArray,
  });
}

export function createMockSyncMessageInit() {
  return createMockSyncMessage("sync-init");
}

// Helper to simulate VS Code sending a message to webview
export function simulateVSCodeMessage(mockAPI: MockVSCodeAPI, message: any) {
  // This would typically be handled by the message listener in the component
  // Tests should call the component's handleSyncMessage directly
  return message;
}

// Helper to verify messages sent to VS Code
export function expectMessageSent(
  mockAPI: MockVSCodeAPI,
  expectedMessage: any,
) {
  expect(mockAPI.postMessage).toHaveBeenCalledWith(
    expect.objectContaining(expectedMessage),
  );
}

export function expectMessageSentTimes(mockAPI: MockVSCodeAPI, times: number) {
  expect(mockAPI.postMessage).toHaveBeenCalledTimes(times);
}

// Helper to clear mock history
export function clearMockHistory(mockAPI: MockVSCodeAPI) {
  mockAPI.postMessage.mockClear();
  mockAPI.getState.mockClear();
  mockAPI.setState.mockClear();
}
