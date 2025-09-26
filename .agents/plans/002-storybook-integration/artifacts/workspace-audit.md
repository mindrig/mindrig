# Workspace audit (2025-09-22)

## Tooling versions

- pnpm: 10.15.1
- node: v22.19.0
- turbo: 2.5.6

## Root scripts of interest

- install/npm: pnpm install
- setup: turbo run setup
- all: turbo run all
- build: turbo run build
- test: turbo run test
- lint: turbo run lint
- lint:fix: turbo run lint:fix
- format: turbo run format
- storybook: pnpm --filter @wrkspc/storybook dev
- build: pnpm --filter @wrkspc/storybook build

## Workspace environment notes

- `mise.toml` pins Node LTS with `corepack enable` postinstall and sets Rust to stable.
- `mise.toml` provisions toolchain helpers such as `cargo-nextest`, `watchexec`, and latest `turbo` via npm.
- Python virtualenvs are auto-managed via uv (`_.python.venv` settings) with `.env.local` as shared env file.

## Target package notes

### @wrkspc/vsc-webview

- React 19.1.1 with `react-dom` 19.1.1 and `react-aria-components` powers the VS Code webview shell.
- Depends on many workspace packages (`@wrkspc/dataset`, `@wrkspc/form`, `@wrkspc/theme`, etc.) plus third-party libs such as `swr`, `yjs`, and markdown previewers.
- Vite-driven scripts (`dev`, `build`, `preview`) emit bundles under `../extension/dist/webview` with manifest support.
- Tooling stack includes Tailwind 4 plugins, PostCSS, and Oxlint/Vitest for linting and tests.

### @wrkspc/ui

- Library of shared design-system primitives exporting from `src/index.ts`.
- Requires React 19.1.1 and `react-aria-components`, along with internal dependencies (`@wrkspc/icons`, `@wrkspc/theme`, `@wrkspc/props`).
- No dedicated build script; consumers rely on TypeScript outputs and bundlers.
- `@wrkspc/theme` serves as a styling peer by providing class name helpers and optional CSS tokens.

## TypeScript configuration summary

- `pkgs/vsc-webview/tsconfig.json` sets `baseUrl` to `.` with `@/*` mapped to `src/*`, uses `jsx: react-jsx`, and injects `env.d.ts` types.
- `subs/ds/pkgs/ui/tsconfig.json` extends the shared `@wrkspc/ts/base` config (`pkgs/ts/base.json`), inheriting bundler module resolution, strict mode, and an `@` alias pointing at `src`.
- The shared base config outputs build info to `.ts/` when emit is enabled and assumes ESNext targets with bundler resolution.
- Storybook must respect supporting configs: `pkgs/vsc-webview/vite.config.ts`, `tailwind.config.ts`, `env.d.ts`, and DS package references declared via `tsconfig.json` project references.

## Global styles and assets

- `pkgs/vsc-webview/src/styles.css` imports Tailwind, `tw-animate-css`, typography/react-aria Tailwind plugins, and maps many CSS variables to VS Code theme tokens.
- The webview root imports `@uiw/react-markdown-preview/markdown.css` before app styles; Storybook needs equivalent global imports.
- DS theming relies on `@wrkspc/theme/src/default.css` (exported as `@wrkspc/theme/default`) for CSS variables; components expect `textCn` helpers and theme tokens to be available.
- Tailwind scanning spans DS packages via `pkgs/vsc-webview/tailwind.config.ts`, so Storybook should load similar content paths or rely on prebuilt styles.
- No custom fonts detected, but icons and assets live in workspace packages (`@wrkspc/icons` etc.) and should resolve through workspace aliasing.
