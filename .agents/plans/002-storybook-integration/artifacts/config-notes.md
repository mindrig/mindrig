# Storybook configuration notes (2025-09-22)

- Pointed Storybook discovery to `pkgs/vsc-webview` and `subs/ds/pkgs/ui` using relative globs so only colocated stories are loaded.
- Swapped the init scaffold for Vite plugins that mirror the app stack: `vite-tsconfig-paths` for workspace aliases and `@tailwindcss/vite` for Tailwind directives inside `styles.css`.
- Limited the addon stack to `@storybook/addon-docs` and `@storybook/addon-a11y`; the `@storybook/addon-essentials` 9.x tag is not yet published, so we will add it once Storybook ships a stable build.
- Imported `pkgs/vsc-webview/src/styles.css` inside `preview.tsx`, configured default backgrounds, and left a TODO to wrap stories with the shared design-system provider when it becomes available.
- Normalised `process.env.NODE_ENV` in `viteFinal` to keep packages that rely on the environment behaving consistently across dev/build.
