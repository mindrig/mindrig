# Assess workspace requirements

## Spec

Capture the current tooling, package structure, and shared assets that will influence Storybook so later steps can wire configuration without surprises.

## Tasks

- [x] [Record workspace tooling context](#record-workspace-tooling-context): Summarize package manager, Turborepo, and Node versions plus relevant scripts into an audit note for future reference.
- [x] [Inventory target packages](#inventory-target-packages): List key dependencies and build outputs for `pkgs/vsc-webview` and `subs/ds/pkgs/ui` to anticipate Storybook needs.
- [x] [Review TypeScript configuration](#review-typescript-configuration): Map the tsconfig hierarchy and path aliases required for cross-package imports inside Storybook.
- [x] [Identify global styles and assets](#identify-global-styles-and-assets): Note CSS, fonts, and other resources Storybook must load to render components faithfully.

### Record workspace tooling context

#### Summary

Document core tooling versions and scripts that will host Storybook.

#### Description

- Create `.agents/plans/001-storybook-integration/artifacts` if it does not already exist and add `workspace-audit.md`.
- Capture `pnpm`, `node`, and `turbo` versions by running `pnpm -v`, `node -v`, and `pnpm turbo --version`; paste the results into the audit doc with the current date.
- Note relevant root scripts from `package.json` (e.g., `build`, `test`, `lint`) and flag whether a Storybook script already exists.
- Record any workspace-wide tooling hints from `mise.toml` or other environment files that Storybook should respect.

### Inventory target packages

#### Summary

Understand the component packages whose stories will surface in Storybook.

#### Description

- Inspect `pkgs/vsc-webview/package.json` and `subs/ds/pkgs/ui/package.json` to list React, styling, and workspace-specific dependencies.
- Note each package’s build scripts and outputs (e.g., Vite builds, published bundles) inside `workspace-audit.md`.
- Record any peer dependency expectations that Storybook must satisfy (such as `react`, `react-dom`, `@wrkspc/theme`).

### Review TypeScript configuration

#### Summary

Determine how path aliases and compiler options should flow into Storybook.

#### Description

- Locate each relevant `tsconfig*.json` (use `rg --files -g'tsconfig*.json' pkgs subs` if needed) and capture which configs `pkgs/vsc-webview` and `subs/ds/pkgs/ui` extend.
- Document key `compilerOptions`—especially `baseUrl`, `paths`, `jsx`, and `types`—that Storybook must mirror.
- Note any non-standard configuration (e.g., `vite.config.ts`, `env.d.ts`) that Storybook needs to integrate with.

### Identify global styles and assets

#### Summary

List styling and static assets that stories must import.

#### Description

- Review `pkgs/vsc-webview/src/styles.css` and any other global stylesheets referenced by the webview app.
- Check whether `subs/ds/pkgs/ui` exports theme variables or expects CSS resets; document required imports or provider components.
- Record paths to fonts, icons, or images that may need `staticDirs` or asset handling in Storybook.

## Questions

None.

## Notes

- Keep artifacts in `.agents/plans/002-storybook-integration/artifacts` so later steps can reference consistent workspace facts (updated from original `001-*` path).
