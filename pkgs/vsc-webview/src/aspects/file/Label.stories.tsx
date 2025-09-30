import type { Meta, StoryObj } from "@storybook/react";
import { SyncFile } from "@wrkspc/vsc-sync";

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
    file: syncFile(),
    isPinned: false,
  },
} satisfies Meta<typeof FileLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PythonFile: Story = {
  args: {
    file: syncFile({
      path: "/wrkspc/project/data_ingest.py",
      languageId: "py",
    }),
  },
};

export const LongPath: Story = {
  args: {
    file: syncFile({
      path: "/wrkspc/mindrig/pkgs/webview/src/aspects/file/LabelPreview.tsx",
      languageId: "js",
    }),
  },
};

function syncFile(overrides: Partial<SyncFile.State> = {}): SyncFile.State {
  return {
    path: "/wrkspc/project/src/index.ts",
    content: 'export const title = "Mind Rig Storybook sample";\n',
    isDirty: false,
    lastSaved: new Date("2025-09-15T12:00:00Z"),
    languageId: "ts",
    ...overrides,
  };
}
