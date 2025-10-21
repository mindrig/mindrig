# Scaffold Storybook package

## Spec

Bootstrap a dedicated `pkgs/storybook` workspace package using Storybook’s Vite builder and align it with existing repo tooling for local dev and CI builds.

## Tasks

- [x] [Create package skeleton](#create-package-skeleton): Add `pkgs/storybook` with baseline `package.json`, TypeScript config, and README aligned to workspace conventions.
- [x] [Initialize Storybook via CLI](#initialize-storybook-via-cli): Run the Storybook generator inside the new package with Vite builder options and confirm generated files.
- [x] [Normalize generated configuration](#normalize-generated-configuration): Tidy up CLI output, remove sample stories, and ensure the config sits under `.storybook` with workspace-friendly paths.
- [x] [Integrate dependencies with pnpm](#integrate-dependencies-with-pnpm): Ensure Storybook dependencies are installed through the monorepo workflow and no stray lockfiles remain.
- [x] [Wire workspace scripts](#wire-workspace-scripts): Add `dev` and `build` scripts to relevant manifests and register Turbo pipeline tasks.

### Create package skeleton

#### Summary

Lay down the directory and metadata Storybook will live in.

#### Description

- Make `pkgs/storybook` and create `package.json` with `name: "@wrkspc/storybook"`, `private: true`, `type: "module"`, and workspace-compatible `engines` if needed.
- Add minimal files (`README.md`, `.gitignore`, `tsconfig.json`) mirroring patterns from other `pkgs/*` React packages.
- Declare dev dependencies shared across stories (e.g., `@types/react`, `react`, `react-dom`) as `workspace:*` where possible to stay in sync with the monorepo.

### Initialize Storybook via CLI

#### Summary

Run Storybook’s official scaffolder using PNPM.

#### Description

- From `pkgs/storybook`, execute `pnpm dlx storybook@latest init --type react --builder @storybook/builder-vite --linting false`.
- Pass `--skip-install` (or the current equivalent flag) so the CLI scaffolds files without running `npm`/`yarn` installs.
- If the CLI refuses to skip installation, allow it to finish then immediately delete any generated `node_modules`, `package-lock.json`, or `yarn.lock` in `pkgs/storybook`.
- Confirm the generator targets the Vite builder and records addons for controls, actions, and docs.
- Verify that `.storybook/main.ts`, `.storybook/preview.ts`, and sample story files are generated where expected.

### Normalize generated configuration

#### Summary

Adapt CLI output to repo expectations.

#### Description

- Remove example `Button` stories the generator adds; we will provide our own in Step 4.
- Ensure configuration files live inside `pkgs/storybook/.storybook` and adjust relative imports if the CLI emits `stories` at the package root.
- Update `tsconfig.json` to extend the repo’s preferred base config (note from Step 1) and enable `jsx: "react-jsx"` if missing.
- Confirm `.storybook/tsconfig.json` references the base config and includes `types: ["vite/client"]` for Vite compatibility.

### Integrate dependencies with pnpm

#### Summary

Install Storybook dependencies through the shared workspace toolchain.

#### Description

- Run `pnpm install` from the repo root to pick up any new dev dependencies added by the generator.
- Verify `pnpm-lock.yaml` captures the Storybook additions without extra `package-lock.json`/`yarn.lock` files lingering under `pkgs/storybook`.
- If the generator added local `node_modules`, ensure they are removed so Turbo and PNPM manage installs centrally.

### Wire workspace scripts

#### Summary

Expose Storybook commands through PNPM and Turborepo.

#### Description

- Add `dev` (`storybook dev -p 3190`) and `build` (`storybook build --output-dir dist`) scripts to `pkgs/storybook/package.json`.
- Update the repo root `package.json` to include shortcuts (`storybook`, `build`) that call into the workspace script via `pnpm --filter @wrkspc/storybook`.
- Extend `turbo.json` with tasks for `dev` and `build`, specifying `outputs` for the build (`pkgs/storybook/dist/**`) and optional cache configuration.
- Capture any additional dependency updates (e.g., lockfile changes) for future execution review.

## Questions

None.

## Notes

- Use PNPM workspace protocols (`workspace:*`) wherever Storybook depends on local packages to avoid version drift.
- External React typings are not published as workspace packages, so semver pins from the Storybook 9.1.7 template are retained.
- If the CLI attempts to install its own `react` or `vite`, pin them to workspace versions during normalization.
