import type { Meta, StoryObj } from "@storybook/react";
import { EditorFile } from "@wrkspc/core/editor";
import { State } from "enso";
import { FileLabel } from "./Label";

const meta = {
  title: "Webview/File Label",
  component: FileLabel,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "File label renderer used inside the VS Code webview header. Stories highlight different language icons and truncated paths.",
      },
    },
  },
  args: {
    fileState: editorFileMetaStateFactory(),
    isPinned: false,
  },
} satisfies Meta<typeof FileLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PythonFile: Story = {
  args: {
    fileState: editorFileMetaStateFactory({
      path: "/wrkspc/project/data_ingest.py" as EditorFile.Path,
      languageId: "py",
    }),
  },
};

export const LongPath: Story = {
  args: {
    fileState: editorFileMetaStateFactory({
      path: "/wrkspc/mindrig/pkgs/webview/src/aspects/file/LabelPreview.tsx" as EditorFile.Path,
      languageId: "js",
    }),
  },
};

function editorFileMetaStateFactory(
  overrides: Partial<EditorFile.Meta> = {},
): State<EditorFile.Meta> {
  return new State<EditorFile.Meta>({
    v: 1,
    path: "/wrkspc/project/src/index.ts" as EditorFile.Path,
    isDirty: false,
    languageId: "ts",
    ...overrides,
  });
}
