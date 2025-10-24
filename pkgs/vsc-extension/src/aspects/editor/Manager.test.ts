import { vscMock } from "@/__tests__/vsc";
import { EditorFile } from "@wrkspc/core/editor";
import { describe, expect, vi } from "vitest";
import { EditorManager } from "./Manager";

describe(EditorManager, () => {
  describe("workspace events", () => {
    describe("onDidChangeActiveTextEditor", () => {
      it("emits active-change event", async () => {
        const { editor, vsc, fsPath, content, isDirty, cursor } =
          setupFactory();

        const spy = vi.fn();
        editor.on(null, "active-change", spy);

        await vsc.emit(
          vsc.window,
          "onDidChangeActiveTextEditor",
          vsc.window.activeTextEditor,
        );

        expect(spy).toHaveBeenCalledWith<[EditorFile]>({
          content,
          isDirty,
          path: fsPath as EditorFile.Path,
          cursor,
          languageId: "ts",
        });
      });
    });
  });
});

function setupFactory() {
  const fsPath = `/file.ts`;
  const content = "// Test";
  const isDirty = true;
  const cursor = { offset: 10, line: 1, character: 2 };

  const vsc = vscMock.setup({
    window: vscMock.Window({
      activeTextEditor: vscMock.TextEditor({
        document: vscMock.TextDocument({
          uri: vscMock.Uri({ fsPath }),
          getText: () => content,
          isDirty,
          offsetAt: () => cursor.offset,
        }),

        selections: [
          vscMock.Selection({
            active: vscMock.Position({
              line: cursor.line,
              character: cursor.character,
            }),
          }),
        ],
      }),
    }),
  });

  const editor = new EditorManager(null);

  return { editor, vsc, fsPath, content, isDirty, cursor };
}
