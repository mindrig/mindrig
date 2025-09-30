import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config: StorybookConfig = {
  stories: [
    "../../vsc-webview/src/**/*.stories.@(ts|tsx)",
    "../../../subs/ds/pkgs/ui/src/**/*.stories.@(ts|tsx)",
  ],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {},
  viteFinal: async (config, { configType }) => {
    const { default: tailwindcss } = await import("@tailwindcss/vite");

    return mergeConfig(config, {
      plugins: [tsconfigPaths(), tailwindcss()],
      define: {
        // Normalise NODE_ENV for packages that rely on it being set.
        "process.env.NODE_ENV": JSON.stringify(
          configType === "PRODUCTION" ? "production" : "development"
        ),
      },
    });
  },
};

export default config;
