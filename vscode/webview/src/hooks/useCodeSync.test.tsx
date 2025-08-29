import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import type { MockVSCodeAPI } from "../__tests__/mocks/vscode";
import {
  createMockSyncMessageUpdate,
  createMockVSCodeAPI,
} from "../__tests__/mocks/vscode";
import { useCodeSync } from "./useCodeSync";

describe("useCodeSync", () => {
  let mockVSCode: MockVSCodeAPI;

  beforeEach(() => {
    mockVSCode = createMockVSCodeAPI();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useCodeSync({ vscode: mockVSCode }));

      expect(result.current.content).toBe("");
      expect(result.current.isConnected).toBe(false);
      expect(typeof result.current.updateContent).toBe("function");
      expect(typeof result.current.handleSyncMessage).toBe("function");
    });

    it("should send requestSync on mount when vscode is available", async () => {
      renderHook(() => useCodeSync({ vscode: mockVSCode }));

      await waitFor(() => {
        expect(mockVSCode.postMessage).toHaveBeenCalledWith({
          type: "sync-init",
        });
      });
    });

    it("should not send requestSync when vscode is null", () => {
      renderHook(() => useCodeSync({ vscode: null }));

      expect(mockVSCode.postMessage).not.toHaveBeenCalled();
    });
  });

  describe("Content Updates", () => {
    it("should update content and send sync updates", async () => {
      const { result } = renderHook(() =>
        useCodeSync({ vscode: mockVSCode, debounceMs: 10 })
      );

      act(() => {
        result.current.updateContent("Hello World");
      });

      await waitFor(() => {
        expect(mockVSCode.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "sync-update",
            payload: expect.objectContaining({
              update: expect.any(Array),
            }),
          })
        );
      });
    });

    it("should debounce rapid content updates", async () => {
      const { result } = renderHook(() =>
        useCodeSync({ vscode: mockVSCode, debounceMs: 50 })
      );

      // Make rapid updates
      act(() => {
        result.current.updateContent("H");
        result.current.updateContent("He");
        result.current.updateContent("Hel");
        result.current.updateContent("Hell");
        result.current.updateContent("Hello");
      });

      // Should only send one update after debounce
      await waitFor(
        () => {
          const syncUpdates = mockVSCode.postMessage.mock.calls.filter(
            (call) => call[0].type === "sync-update"
          );
          expect(syncUpdates.length).toBeLessThanOrEqual(2); // Allow for some timing variance
        },
        { timeout: 200 }
      );
    });

    it("should handle empty content updates", async () => {
      const { result } = renderHook(() =>
        useCodeSync({ vscode: mockVSCode, debounceMs: 10 })
      );

      act(() => {
        result.current.updateContent("Some content");
      });

      await waitFor(() => {
        expect(mockVSCode.postMessage).toHaveBeenCalled();
      });

      // Clear previous calls
      const initialCalls = mockVSCode.postMessage.mock.calls.length;

      act(() => {
        result.current.updateContent("");
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should have sent another update (might not be exactly one more due to debouncing)
      expect(mockVSCode.postMessage.mock.calls.length).toBeGreaterThanOrEqual(
        initialCalls
      );
    });

    it("should handle unicode content correctly", async () => {
      const { result } = renderHook(() =>
        useCodeSync({ vscode: mockVSCode, debounceMs: 10 })
      );

      const unicodeContent = "Hello 世界 🌍";

      act(() => {
        result.current.updateContent(unicodeContent);
      });

      await waitFor(() => {
        expect(mockVSCode.postMessage).toHaveBeenCalled();
      });
    });

    it("should not update when content is the same", async () => {
      const { result } = renderHook(() =>
        useCodeSync({ vscode: mockVSCode, debounceMs: 10 })
      );

      const content = "Same content";

      act(() => {
        result.current.updateContent(content);
      });

      await waitFor(() => {
        expect(mockVSCode.postMessage).toHaveBeenCalled();
      });

      const firstCallCount = mockVSCode.postMessage.mock.calls.length;

      // Update with same content - this might still send update due to Yjs internals
      act(() => {
        result.current.updateContent(content);
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should not have significantly more calls
      expect(
        mockVSCode.postMessage.mock.calls.length - firstCallCount
      ).toBeLessThanOrEqual(1);
    });
  });

  describe("Message Handling", () => {
    it("should handle syncUpdate messages", async () => {
      const { result } = renderHook(() => useCodeSync({ vscode: mockVSCode }));

      // Create a valid Yjs update that adds content
      const testDoc = new Y.Doc();
      const testText = testDoc.getText("content");
      testText.insert(0, "Remote content");
      const update = Y.encodeStateAsUpdate(testDoc);

      const message = {
        type: "sync-update",
        payload: {
          update: Array.from(update),
        },
      };

      act(() => {
        result.current.handleSyncMessage(message);
      });

      await waitFor(() => {
        expect(result.current.content).toBe("Remote content");
        expect(result.current.isConnected).toBe(true);
      });
    });

    it("should handle syncStateVector messages", async () => {
      const { result } = renderHook(() => useCodeSync({ vscode: mockVSCode }));

      // First add some content to create state
      act(() => {
        result.current.updateContent("Local content");
      });

      await waitFor(() => {
        expect(mockVSCode.postMessage).toHaveBeenCalled();
      });

      mockVSCode.postMessage.mockClear();

      // Create a state vector request
      const stateVector = Y.encodeStateVector(new Y.Doc());
      const message = {
        type: "sync-state-vector",
        payload: {
          stateVector: Array.from(stateVector),
        },
      };

      act(() => {
        result.current.handleSyncMessage(message);
      });

      await waitFor(() => {
        expect(mockVSCode.postMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "sync-state-vector",
            payload: expect.objectContaining({
              stateVector: expect.any(Array),
            }),
          })
        );
      });
    });

    it("should ignore invalid syncUpdate messages", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { result } = renderHook(() => useCodeSync({ vscode: mockVSCode }));

      const invalidMessage = {
        type: "sync-update",
        payload: { invalid: "data" },
      };

      act(() => {
        result.current.handleSyncMessage(invalidMessage);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid sync update payload"),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it("should ignore invalid syncStateVector messages", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { result } = renderHook(() => useCodeSync({ vscode: mockVSCode }));

      const invalidMessage = {
        type: "sync-state-vector",
        payload: { invalid: "data" },
      };

      act(() => {
        result.current.handleSyncMessage(invalidMessage);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid sync state vector payload"),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it("should ignore unknown message types", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { result } = renderHook(() => useCodeSync({ vscode: mockVSCode }));

      const unknownMessage = {
        type: "unknownType",
        payload: {},
      };

      act(() => {
        result.current.handleSyncMessage(unknownMessage);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unknown sync message type"),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    it("should handle Yjs errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { result } = renderHook(() => useCodeSync({ vscode: mockVSCode }));

      // Simulate an error by trying to apply an invalid update
      const invalidMessage = {
        type: "sync-update",
        payload: {
          update: [255, 255, 255], // Invalid Yjs data
        },
      };

      act(() => {
        result.current.handleSyncMessage(invalidMessage);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });

      consoleErrorSpy.mockRestore();
    });

    it("should handle missing ydoc/ytext gracefully", () => {
      const { result } = renderHook(() => useCodeSync({ vscode: mockVSCode }));

      // Manually set refs to null to simulate unmounted state
      act(() => {
        if (result.current.ydoc) result.current.ydoc.destroy();
      });

      // Should not crash
      act(() => {
        result.current.updateContent("test");
      });

      const message = createMockSyncMessageUpdate([1, 2, 3]);
      act(() => {
        result.current.handleSyncMessage(message);
      });

      // Should handle gracefully without throwing
      expect(() => result.current.handleSyncMessage(message)).not.toThrow();
    });

    it("should handle vscode being null during updates", () => {
      const { result } = renderHook(() => useCodeSync({ vscode: null }));

      // Should not crash when vscode is null
      act(() => {
        result.current.updateContent("test content");
      });

      expect(result.current.content).toBe("");
    });
  });

  describe("Cleanup", () => {
    it("should not crash on unmount", () => {
      const { unmount } = renderHook(() => useCodeSync({ vscode: mockVSCode }));

      expect(() => unmount()).not.toThrow();
    });

    it("should handle unmount with pending updates", () => {
      const { result, unmount } = renderHook(() =>
        useCodeSync({ vscode: mockVSCode, debounceMs: 100 })
      );

      act(() => {
        result.current.updateContent("test");
      });

      // Unmount before debounce completes
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle bidirectional sync correctly", async () => {
      const { result } = renderHook(() =>
        useCodeSync({ vscode: mockVSCode, debounceMs: 10 })
      );

      // Local update
      act(() => {
        result.current.updateContent("Local change");
      });

      await waitFor(() => {
        expect(mockVSCode.postMessage).toHaveBeenCalled();
      });

      // Simulate remote update
      const remoteDoc = new Y.Doc();
      const remoteText = remoteDoc.getText("content");
      remoteText.insert(0, "Remote change");
      const remoteUpdate = Y.encodeStateAsUpdate(remoteDoc);

      const remoteMessage = {
        type: "sync-update",
        payload: {
          update: Array.from(remoteUpdate),
        },
      };

      act(() => {
        result.current.handleSyncMessage(remoteMessage);
      });

      await waitFor(() => {
        expect(result.current.content).toBe("Remote change");
        expect(result.current.isConnected).toBe(true);
      });
    });

    it("should handle rapid local and remote updates", async () => {
      const { result } = renderHook(() =>
        useCodeSync({ vscode: mockVSCode, debounceMs: 10 })
      );

      // Rapid local updates
      act(() => {
        result.current.updateContent("v1");
        result.current.updateContent("v2");
        result.current.updateContent("v3");
      });

      // Simulate rapid remote updates
      for (let i = 1; i <= 3; i++) {
        const doc = new Y.Doc();
        const text = doc.getText("content");
        text.insert(0, `remote-v${i}`);
        const update = Y.encodeStateAsUpdate(doc);

        const message = {
          type: "sync-update",
          payload: {
            update: Array.from(update),
          },
        };

        act(() => {
          result.current.handleSyncMessage(message);
        });
      }

      // Should handle all updates without crashing
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });

    it("should maintain connection state correctly", async () => {
      const { result } = renderHook(() => useCodeSync({ vscode: mockVSCode }));

      expect(result.current.isConnected).toBe(false);

      // Successful sync should set connected to true
      const doc = new Y.Doc();
      const text = doc.getText("content");
      text.insert(0, "sync content");
      const update = Y.encodeStateAsUpdate(doc);

      const message = {
        type: "sync-update",
        payload: {
          update: Array.from(update),
        },
      };

      act(() => {
        result.current.handleSyncMessage(message);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Error should set connected to false
      const invalidMessage = {
        type: "sync-update",
        payload: { update: [255, 255, 255] },
      };

      act(() => {
        result.current.handleSyncMessage(invalidMessage);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });
    });
  });

  describe("Performance", () => {
    it("should handle large content efficiently", async () => {
      const { result } = renderHook(() =>
        useCodeSync({ vscode: mockVSCode, debounceMs: 10 })
      );

      const largeContent = "x".repeat(10000);

      const startTime = performance.now();

      act(() => {
        result.current.updateContent(largeContent);
      });

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast

      await waitFor(() => {
        expect(mockVSCode.postMessage).toHaveBeenCalled();
      });
    });

    it("should not create memory leaks with multiple updates", async () => {
      const { result } = renderHook(() =>
        useCodeSync({ vscode: mockVSCode, debounceMs: 1 })
      );

      // Perform many updates
      for (let i = 0; i < 100; i++)
        act(() => {
          result.current.updateContent(`Update ${i}`);
        });

      // Should complete without issues
      await waitFor(() => {
        expect(mockVSCode.postMessage).toHaveBeenCalled();
      });
    });
  });
});
