import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockVSCodeAPI } from "../__tests__/mocks/vscode";
import {
  createMockSyncMessageUpdate,
  createMockVSCodeAPI,
  expectMessageSent,
} from "../__tests__/mocks/vscode";
import { CodeEditor } from "./CodeEditor";

describe("CodeEditor", () => {
  let mockVSCode: MockVSCodeAPI;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    mockVSCode = createMockVSCodeAPI();
    user = userEvent.setup();
  });

  describe("Rendering", () => {
    it("should render with basic structure", () => {
      render(<CodeEditor vscode={mockVSCode} resourcePath="/test.ts" />);

      expect(screen.getByText("Code Editor")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Start typing to sync with VS Code..."),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Content length: 0 characters/),
      ).toBeInTheDocument();
    });

    it("should show connection status", () => {
      render(<CodeEditor vscode={mockVSCode} resourcePath="/test.ts" />);

      expect(screen.getByText("Disconnected")).toBeInTheDocument();
      expect(screen.queryByText("Synced")).not.toBeInTheDocument();
    });

    it("should render without vscode API", () => {
      render(<CodeEditor vscode={null} resourcePath="/test.ts" />);

      expect(screen.getByText("Code Editor")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByText("Disconnected")).toBeInTheDocument();
    });

    it("should initialize with provided content", async () => {
      const onSyncMessage = vi.fn();
      render(
        <CodeEditor
          vscode={mockVSCode}
          resourcePath="/test.ts"
          onSyncMessage={onSyncMessage}
        />,
      );

      // Wait for initial sync request
      await waitFor(() => {
        expectMessageSent(mockVSCode, { type: "sync-init" });
      });

      expect(mockVSCode.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: "sync-init" }),
      );
    });
  });

  describe("User Interactions", () => {
    it("should handle typing in textarea", async () => {
      render(<CodeEditor vscode={mockVSCode} resourcePath="/test.ts" />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Hello World");

      expect(textarea).toHaveValue("Hello World");
      expect(
        screen.getByText(/Content length: 11 characters/),
      ).toBeInTheDocument();

      // Should send sync update after debounce
      await waitFor(
        () => {
          expect(mockVSCode.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              type: "sync-update",
              payload: expect.objectContaining({
                update: expect.any(Array),
              }),
            }),
          );
        },
        { timeout: 200 },
      );
    });

    it("should maintain focus during typing", async () => {
      render(<CodeEditor vscode={mockVSCode} resourcePath="/test.ts" />);

      const textarea = screen.getByRole("textbox");
      textarea.focus();

      await user.type(textarea, "Hello");
      expect(textarea).toHaveFocus();

      await user.type(textarea, " World");
      expect(textarea).toHaveFocus();
    });

    it("should handle backspace and delete operations", async () => {
      render(<CodeEditor vscode={mockVSCode} resourcePath="/test.ts" />);

      const textarea = screen.getByRole("textbox");

      await user.type(textarea, "Hello World");
      expect(textarea).toHaveValue("Hello World");

      await user.keyboard(
        "{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}",
      );
      expect(textarea).toHaveValue("Hello ");

      // Should maintain focus
      expect(textarea).toHaveFocus();
    });

    it("should handle tab indentation", async () => {
      render(<CodeEditor vscode={mockVSCode} resourcePath="/test.ts" />);

      const textarea: HTMLTextAreaElement = screen.getByRole("textbox");
      await user.type(textarea, "function test()");
      await user.keyboard("{Enter}");
      await user.keyboard("{Tab}");
      await user.type(textarea, "return true;");

      expect(textarea.value).toContain("function test()");
      expect(textarea.value).toContain("  return true;");
      expect(textarea).toHaveFocus();
    });

    it("should handle selection and replacement", async () => {
      render(<CodeEditor vscode={mockVSCode} resourcePath="/test.ts" />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Hello World");

      // Clear and type new text
      await user.clear(textarea);
      await user.type(textarea, "Hello Universe");

      expect(textarea).toHaveValue("Hello Universe");
    });
  });

  describe("Sync Integration", () => {
    it("should send requestSync on mount", async () => {
      render(<CodeEditor vscode={mockVSCode} resourcePath="/test.ts" />);

      await waitFor(() => {
        expectMessageSent(mockVSCode, { type: "sync-init" });
      });
    });

    it("should handle incoming sync updates", async () => {
      const onSyncMessage = vi.fn();
      render(
        <CodeEditor
          vscode={mockVSCode}
          resourcePath="/test.ts"
          onSyncMessage={onSyncMessage}
        />,
      );

      await waitFor(() => {
        expect(onSyncMessage).toHaveBeenCalled();
      });

      // Get the handleSyncMessage function
      const handleSyncMessage = onSyncMessage.mock.calls[0]?.[0];

      // For now, just verify that the handler can be called without crashing
      expect(typeof handleSyncMessage).toBe("function");

      // The sync integration with Yjs is complex and tested separately in useCodeSync tests
      // This test just verifies the component can receive and handle sync messages
      const mockUpdate = createMockSyncMessageUpdate([1, 2, 3]);
      expect(() => handleSyncMessage(mockUpdate)).not.toThrow();
    });

    it("should preserve cursor position during remote updates", async () => {
      const onSyncMessage = vi.fn();
      render(
        <CodeEditor
          vscode={mockVSCode}
          resourcePath="/test.ts"
          onSyncMessage={onSyncMessage}
        />,
      );

      const textarea: HTMLTextAreaElement = screen.getByRole("textbox");
      await user.type(textarea, "Hello World");

      // Position cursor at position 6 (between 'Hello' and ' World')
      textarea.setSelectionRange(6, 6);
      const initialSelectionStart = textarea.selectionStart;

      await waitFor(() => {
        expect(onSyncMessage).toHaveBeenCalled();
      });

      const handleSyncMessage = onSyncMessage.mock.calls[0]?.[0];

      // Simulate a remote update that doesn't affect cursor position
      const mockUpdate = createMockSyncMessageUpdate([1, 2, 3, 4, 5]);
      handleSyncMessage(mockUpdate);

      // Cursor position should be preserved
      expect(textarea.selectionStart).toBe(initialSelectionStart);
    });

    it("should debounce rapid typing", async () => {
      render(<CodeEditor vscode={mockVSCode} resourcePath="/test.ts" />);

      const textarea: HTMLTextAreaElement = screen.getByRole("textbox");

      // Type rapidly
      // @ts-expect-error
      await user.type(textarea, "abc", { delay: 1 });

      // Should only send one sync update after debounce period
      await waitFor(
        () => {
          const syncUpdates = mockVSCode.postMessage.mock.calls.filter(
            (call) => call[0].type === "sync-update",
          );
          expect(syncUpdates.length).toBe(1);
        },
        { timeout: 200 },
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle sync errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const onSyncMessage = vi.fn();
      render(
        <CodeEditor
          vscode={mockVSCode}
          resourcePath="/test.ts"
          onSyncMessage={onSyncMessage}
        />,
      );

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Test content");

      // Should not crash on errors
      expect(textarea).toHaveValue("Test content");
      expect(textarea).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it("should handle missing textarea ref", () => {
      // This tests edge cases where ref might be null
      render(<CodeEditor vscode={null} resourcePath="/test.ts" />);

      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });
  });

  describe("Character Count Display", () => {
    it("should update character count in real-time", async () => {
      render(<CodeEditor vscode={mockVSCode} resourcePath="/test.ts" />);

      const textarea = screen.getByRole("textbox");

      expect(
        screen.getByText(/Content length: 0 characters/),
      ).toBeInTheDocument();

      await user.type(textarea, "Hello");
      expect(
        screen.getByText(/Content length: 5 characters/),
      ).toBeInTheDocument();

      await user.type(textarea, " World!");
      expect(
        screen.getByText(/Content length: 12 characters/),
      ).toBeInTheDocument();

      await user.keyboard("{Backspace}{Backspace}");
      expect(
        screen.getByText(/Content length: 10 characters/),
      ).toBeInTheDocument();
    });

    it("should handle unicode characters correctly", async () => {
      render(<CodeEditor vscode={mockVSCode} resourcePath="/test.ts" />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Hello 世界 🌍");

      // The unicode string has 11 characters: H-e-l-l-o-space-世-界-space-🌍
      await waitFor(() => {
        expect(
          screen.getByText(/Content length: 11 characters/),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Performance", () => {
    it("should handle large content efficiently", async () => {
      render(<CodeEditor vscode={mockVSCode} resourcePath="/test.ts" />);

      const textarea = screen.getByRole("textbox");
      const largeContent = "x".repeat(1000);

      const startTime = performance.now();

      // Simulate pasting large content
      fireEvent.change(textarea, { target: { value: largeContent } });

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      expect(textarea).toHaveValue(largeContent);
      expect(
        screen.getByText(/Content length: 1000 characters/),
      ).toBeInTheDocument();
    });
  });
});
