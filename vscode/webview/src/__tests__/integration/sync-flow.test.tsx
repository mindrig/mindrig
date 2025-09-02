import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import { CodeEditor } from "../../components/CodeEditor";
import type { MockVSCodeAPI } from "../mocks/vscode";
import { createMockVSCodeAPI } from "../mocks/vscode";

describe("End-to-End Sync Flow", () => {
  let mockVSCode: MockVSCodeAPI;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    mockVSCode = createMockVSCodeAPI();
    user = userEvent.setup();
  });

  describe("Complete Sync Workflow", () => {
    it("should handle complete bidirectional sync workflow", async () => {
      let handleSyncMessage: ((message: any) => void) | null = null;

      const onSyncMessage = vi.fn((handler) => {
        handleSyncMessage = handler;
      });

      render(
        <CodeEditor
          vscode={mockVSCode}
          resourcePath="/test.ts"
          onSyncMessage={onSyncMessage}
        />,
      );

      const textarea: HTMLTextAreaElement = screen.getByRole("textbox");

      // Wait for component to initialize and get sync handler
      await waitFor(() => {
        expect(onSyncMessage).toHaveBeenCalled();
        expect(handleSyncMessage).toBeTruthy();
      });

      // Step 1: User types in webview
      await user.type(textarea, "Hello from webview");

      expect(textarea).toHaveValue("Hello from webview");
      expect(
        screen.getByText(/Content length: 18 characters/),
      ).toBeInTheDocument();

      // Step 2: Verify sync message was sent to VS Code
      await waitFor(() => {
        const syncCalls = mockVSCode.postMessage.mock.calls.filter(
          (call) => call[0].type === "sync-update",
        );
        expect(syncCalls.length).toBeGreaterThan(0);
      });

      // Step 3: Simulate VS Code sending remote update
      const remoteDoc = new Y.Doc();
      const remoteText = remoteDoc.getText("content");
      remoteText.insert(0, "Remote content from VS Code");
      const remoteUpdate = Y.encodeStateAsUpdate(remoteDoc);

      const remoteMessage = {
        type: "sync-update",
        payload: { update: Array.from(remoteUpdate) },
      };

      handleSyncMessage!(remoteMessage);

      // Step 4: Verify webview updated with remote content and shows synced status
      await waitFor(() => {
        expect(textarea.value).toContain("Remote content from VS Code");
        expect(screen.getByText("Synced")).toBeInTheDocument();
      });

      // Step 5: Test focus is maintained during updates
      textarea.focus();
      expect(textarea).toHaveFocus();

      // Simulate another remote update - clear and set new content
      const remoteDoc2 = new Y.Doc();
      const remoteText2 = remoteDoc2.getText("content");
      remoteText2.insert(0, "Updated content");
      const remoteUpdate2 = Y.encodeStateAsUpdate(remoteDoc2);

      handleSyncMessage!({
        type: "sync-update",
        payload: { update: Array.from(remoteUpdate2) },
      });

      // Focus should be maintained, but content will be merged with existing content due to CRDT behavior
      await waitFor(() => {
        // CRDT merges content, so we check that textarea contains new content
        expect(textarea.value).toContain("Updated content");
      });
      expect(textarea).toHaveFocus();
    });

    it("should handle rapid typing and sync without losing characters", async () => {
      let handleSyncMessage: ((message: any) => void) | null = null;

      const onSyncMessage = vi.fn((handler) => {
        handleSyncMessage = handler;
      });

      render(
        <CodeEditor
          vscode={mockVSCode}
          resourcePath="/test.ts"
          onSyncMessage={onSyncMessage}
        />,
      );

      const textarea = screen.getByRole("textbox");

      await waitFor(() => {
        expect(handleSyncMessage).toBeTruthy();
      });

      // Rapidly type multiple words
      const words = ["quick", "brown", "fox", "jumps", "over"];

      for (const word of words) await user.type(textarea, word + " ");

      expect(textarea).toHaveValue("quick brown fox jumps over ");
      expect(textarea).toHaveFocus();

      // Should have sent sync updates
      await waitFor(() => {
        const syncCalls = mockVSCode.postMessage.mock.calls.filter(
          (call) => call[0].type === "sync-update",
        );
        expect(syncCalls.length).toBeGreaterThan(0);
      });
    });

    it("should handle connection state changes correctly", async () => {
      let handleSyncMessage: ((message: any) => void) | null = null;

      const onSyncMessage = vi.fn((handler) => {
        handleSyncMessage = handler;
      });

      render(
        <CodeEditor
          vscode={mockVSCode}
          resourcePath="/test.ts"
          onSyncMessage={onSyncMessage}
        />,
      );

      // Initially disconnected
      expect(screen.getByText("Disconnected")).toBeInTheDocument();

      await waitFor(() => {
        expect(handleSyncMessage).toBeTruthy();
      });

      // Successful sync should show connected
      const doc = new Y.Doc();
      const text = doc.getText("content");
      text.insert(0, "Connected!");
      const update = Y.encodeStateAsUpdate(doc);

      handleSyncMessage!({
        type: "sync-update",
        payload: { update: Array.from(update) },
      });

      await waitFor(() => {
        expect(screen.getByText("Synced")).toBeInTheDocument();
      });

      // Invalid sync should show disconnected
      handleSyncMessage!({
        type: "sync-update",
        payload: { update: [255, 255, 255] }, // Invalid data
      });

      await waitFor(() => {
        expect(screen.getByText("Disconnected")).toBeInTheDocument();
      });
    });

    it("should handle complex editing operations", async () => {
      let handleSyncMessage: ((message: any) => void) | null = null;

      const onSyncMessage = vi.fn((handler) => {
        handleSyncMessage = handler;
      });

      render(
        <CodeEditor
          vscode={mockVSCode}
          resourcePath="/test.ts"
          onSyncMessage={onSyncMessage}
        />,
      );

      const textarea: HTMLTextAreaElement = screen.getByRole("textbox");

      await waitFor(() => {
        expect(handleSyncMessage).toBeTruthy();
      });

      // Type initial content (avoiding curly braces which cause parsing issues)
      await user.type(textarea, "function hello()");
      await user.keyboard("{Enter}");
      await user.keyboard("{Tab}");
      await user.type(textarea, 'console.log("Hello");');

      expect(textarea.value).toContain("function hello()");
      expect(textarea.value).toContain('console.log("Hello");');

      // Test selection and editing
      await user.clear(textarea);
      await user.type(textarea, 'const greeting = "Hello World";');

      expect(textarea).toHaveValue('const greeting = "Hello World";');
      expect(
        screen.getByText(/Content length: 31 characters/),
      ).toBeInTheDocument();

      // Should maintain focus throughout
      expect(textarea).toHaveFocus();
    });

    it("should handle error scenarios gracefully", async () => {
      let handleSyncMessage: ((message: any) => void) | null = null;

      const onSyncMessage = vi.fn((handler) => {
        handleSyncMessage = handler;
      });

      render(
        <CodeEditor
          vscode={mockVSCode}
          resourcePath="/test.ts"
          onSyncMessage={onSyncMessage}
        />,
      );

      const textarea = screen.getByRole("textbox");

      await waitFor(() => {
        expect(handleSyncMessage).toBeTruthy();
      });

      // Type some content
      await user.type(textarea, "Test content");
      expect(textarea).toHaveValue("Test content");

      // Send malformed messages - should not crash
      expect(() => {
        handleSyncMessage!({ type: "unknown", payload: {} });
        handleSyncMessage!({
          type: "sync-update",
          payload: { invalid: "data" },
        });
        handleSyncMessage!({ invalidStructure: true });
      }).not.toThrow();

      // Component should still be functional
      await user.type(textarea, " more content");
      expect(textarea).toHaveValue("Test content more content");
      expect(textarea).toHaveFocus();
    });
  });

  describe("Performance Tests", () => {
    it("should handle large documents without performance issues", async () => {
      let handleSyncMessage: ((message: any) => void) | null = null;

      const onSyncMessage = vi.fn((handler) => {
        handleSyncMessage = handler;
      });

      render(
        <CodeEditor
          vscode={mockVSCode}
          resourcePath="/test.ts"
          onSyncMessage={onSyncMessage}
        />,
      );

      const textarea: HTMLTextAreaElement = screen.getByRole("textbox");

      await waitFor(() => {
        expect(handleSyncMessage).toBeTruthy();
      });

      // Create large content
      const largeContent =
        "This is a line of text that will be repeated.\n".repeat(100);

      // Simulate receiving large document from VS Code
      const largeDoc = new Y.Doc();
      const largeText = largeDoc.getText("content");
      largeText.insert(0, largeContent);
      const largeUpdate = Y.encodeStateAsUpdate(largeDoc);

      const startTime = performance.now();

      handleSyncMessage!({
        type: "sync-update",
        payload: { update: Array.from(largeUpdate) },
      });

      await waitFor(() => {
        expect(textarea.value.length).toBeGreaterThan(1000); // Should contain large content
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process large documents reasonably quickly
      expect(processingTime).toBeLessThan(1000); // Increased timeout for CI

      // Should show updated character count
      expect(
        screen.getByText(/Content length: \d+ characters/),
      ).toBeInTheDocument();
    });

    it("should maintain responsiveness during rapid sync updates", async () => {
      let handleSyncMessage: ((message: any) => void) | null = null;

      const onSyncMessage = vi.fn((handler) => {
        handleSyncMessage = handler;
      });

      render(
        <CodeEditor
          vscode={mockVSCode}
          resourcePath="/test.ts"
          onSyncMessage={onSyncMessage}
        />,
      );

      await waitFor(() => {
        expect(handleSyncMessage).toBeTruthy();
      });

      // Send multiple rapid updates
      for (let i = 0; i < 10; i++) {
        const doc = new Y.Doc();
        const text = doc.getText("content");
        text.insert(0, `Update ${i}`);
        const update = Y.encodeStateAsUpdate(doc);

        handleSyncMessage!({
          type: "sync-update",
          payload: { update: Array.from(update) },
        });
      }

      // Should handle all updates without crashing
      await waitFor(() => {
        expect(screen.getByText("Synced")).toBeInTheDocument();
      });

      const textarea: HTMLTextAreaElement = screen.getByRole("textbox");
      expect(textarea).toBeInTheDocument();

      // Should still be responsive to user input
      await user.type(textarea, " user input");
      expect(textarea.value).toContain("user input");
    });
  });
});
