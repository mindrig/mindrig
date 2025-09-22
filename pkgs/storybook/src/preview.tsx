import type { Preview } from "@storybook/react-vite";

// TODO: Move styles into a package, e.g. @wrkspc/vsc-theme.
import "../../vsc-webview/src/styles.css";

export const parameters: Preview["parameters"] = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i,
    },
  },
  backgrounds: {
    default: "canvas",
    values: [
      { name: "Canvas", value: "var(--color-canvas, #1e1e1e)" },
      { name: "Surface", value: "var(--vscode-editor-background, #2d2d2d)" },
    ],
  },
  layout: "padded",
  a11y: {
    // Keep checks visible in dev UI; promote to "error" when gating CI.
    test: "todo",
  },
};

export const decorators: Preview["decorators"] = [
  (Story) => (
    <div className="min-h-screen bg-[var(--color-canvas,#1e1e1e)] text-[var(--color-ink,#f3f3f3)] font-sans">
      <Story />
    </div>
  ),
  // TODO: Wrap stories with the shared design system provider when exposed from @wrkspc/theme.
];
