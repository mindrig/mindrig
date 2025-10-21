# Packages

## Catalogue

- [`@wrkspc/core`](../../pkgs/dataset): Shared functionality between VS Code extension and webview.
- [`@wrkspc/file`](../../pkgs/file): Mind Rig file aspect utilities.
- [`@wrkspc/gateway`](../../pkgs/gateway): Cloudflare Workers gateway for routing AI requests.
- [`@wrkspc/lang`](../../pkgs/lang): Mind Rig language aspect helpers.
- [`@wrkspc/model`](../../pkgs/model): Mind Rig model aspect utilities.
- [`mindrig_parser`](../../pkgs/parser) (public): Mind Rig parser crate interface for workspace consumers.
- [`@mindrig/parser-wasm`](../../pkgs/parser/pkg) (public): Mind Rig parser WebAssembly bundle.
- [`@wrkspc/prompt`](../../pkgs/prompt): Prompt utilities (interpolation, detection, extraction).
- [`@wrkspc/settings`](../../pkgs/settings): Mind Rig settings aspect helpers.
- [`@wrkspc/ts`](../../pkgs/ts): Shared TypeScript configuration.
- [`@wrkspc/types-src`](../../pkgs/types): Genotype build workspace for shared types.
- [`@mindrig/types`](../../pkgs/types/pkgs/ts) (public): Generated TypeScript types for prompts and schema data.
- [`mindrig_types`](../../pkgs/types/pkgs/rs) (public): Mind Rig shared types crate.
- [`vscode`](../../pkgs/vsc-extension) (public): Mind Rig extension for VS Code.
- [`@wrkspc/vsc-settings`](../../pkgs/vsc-settings): Mind Rig VS Code settings helpers.
- [`@wrkspc/vsc-sync`](../../pkgs/vsc-sync): Workspace sync helpers for VS Code.
- [`@wrkspc/core`](../../pkgs/vsc-types): VS Code type declarations for Mind Rig extension.
- [`@wrkspc/vsc-webview`](../../pkgs/vsc-webview): Mind Rig webview React application.

## Storybook

Storybook lives in the private package [`@wrkspc/storybook`](../../pkgs/storybook). Install workspace dependencies with `pnpm install` before running any Storybook commands.

### Run Storybook locally

- `pnpm --filter @wrkspc/storybook dev` starts the dev server on http://localhost:3190.
- The host aggregates stories from `pkgs/vsc-webview` and `subs/ds/pkgs/ui`; it hot reloads changes to colocated `*.stories.tsx` files.
- Set `STORYBOOK_DISABLE_TELEMETRY=1` locally if you prefer to skip upstream telemetry.

### Build the static bundle

- `pnpm --filter @wrkspc/storybook build` outputs the static site to `pkgs/storybook/dist`.
- Inspect `pkgs/storybook/dist/index.html` and `iframe.html` before opening a pull request to confirm sample stories render and styling holds.
- Commit the build output only when specifically requested; the default workflow keeps `dist/` untracked.

### Story ownership

- Stories live alongside their components. Limit coverage to `pkgs/vsc-webview/src` and `subs/ds/pkgs/ui/src` until the globs in `pkgs/storybook/.storybook/main.ts` are updated.
- Name files `Component.stories.tsx`, export a default `Meta`, and prefer colocated mocks (`pkgs/storybook/src/mocks/*`) when sharing fixtures between packages.
- If another package needs Storybook support, open an issue and expand the `stories` array in `pkgs/storybook/.storybook/main.ts` as part of the change.

## Naming Schema

### npm packages

- `@wrkspc/{pkg}` — default scope for private npm packages.
- `@mindrig/{pkg}` — reserve for public npm packages.

### Rust crates

- `wrkspc_{crate}` — private Rust crates.
- `mindrig_{crate}` — public Rust crates.

## Policies

- Keep packages private unless they must be published, or dependencies (including transient) of public packages (for example, `dependencies` of `vscode` package, or `dependencies` and `dev-dependencies` of `mindrig_parser`).
