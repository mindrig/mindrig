# Storybook Integration Plan

## Brief

Introduce Storybook to the monorepo using a new `pkgs/storybook` workspace package that aggregates stories from `pkgs/vsc-webview` and `subs/ds/pkgs/ui`, aligns with Turborepo guidance, updates contributor docs, and ensures the static build outputs to `pkgs/storybook/dist` after validation.

## Plan

- [ ] [Assess Workspace Requirements](agents/plans/001-storybook-integration/001-assess-workspace.md): Confirm tooling, package manager configuration, and existing component setup to scope Storybook dependencies and targets.
- [ ] [Scaffold Storybook Package](agents/plans/001-storybook-integration/002-scaffold-storybook.md): Create `pkgs/storybook` with Storybook boilerplate following Turborepo recommendations while adapting paths and scripts to the `pkgs` namespace.
- [ ] [Configure Shared Stories](agents/plans/001-storybook-integration/003-configure-stories.md): Point Storybook to stories in `pkgs/vsc-webview` and `subs/ds/pkgs/ui`, centralize TypeScript/alias config, and ensure hot reloading works across packages.
- [ ] [Author Sample Stories](agents/plans/001-storybook-integration/004-sample-stories.md): Draft example stories for `Button` and `FileLabel` components to validate Storybook rendering and establish conventions.
- [ ] [Update Contributor Docs](agents/plans/001-storybook-integration/005-update-docs.md): Refresh `docs/contributing/pkgs.md` with Storybook usage, scripts, and package details scoped to `pkgs/storybook`.
- [ ] [Build & Verify Static Output](agents/plans/001-storybook-integration/006-static-build-verify.md): Configure build pipeline, produce static assets in `pkgs/storybook/dist`, and document manual verification steps.

## Steps

### [Assess Workspace Requirements](agents/plans/001-storybook-integration/001-assess-workspace.md)

Inventory existing React packages, confirm PNPM/Turborepo setup, and note workspace path conventions to choose compatible Storybook builder options and dependency versions.

### [Scaffold Storybook Package](agents/plans/001-storybook-integration/002-scaffold-storybook.md)

Use Storybook's init workflow (via `pnpm dlx storybook@latest init`) targeting a React + Vite stack, adjust generated configs to live under `pkgs/storybook`, and wire scripts and `turbo.json` tasks for `storybook:dev` and `storybook:build`.

### [Configure Shared Stories](agents/plans/001-storybook-integration/003-configure-stories.md)

Update `main.ts` and supporting config to include story globs from `pkgs/vsc-webview` and `subs/ds/pkgs/ui`, share tsconfig path aliases, and add workspace-specific preview setup (global styles, providers) so both packages render consistently.

### [Author Sample Stories](agents/plans/001-storybook-integration/004-sample-stories.md)

Implement foundational stories for `subs/ds/pkgs/ui/src/Button.tsx` and `pkgs/vsc-webview/src/aspects/file/Label.tsx`, capturing representative props/states and documenting usage patterns to guide future story authors.

### [Update Contributor Docs](agents/plans/001-storybook-integration/005-update-docs.md)

Extend `docs/contributing/pkgs.md` with instructions for running Storybook locally, expectations for story locations, sample commands, and notes about the `pkgs/storybook` package lifecycle.

### [Build & Verify Static Output](agents/plans/001-storybook-integration/006-static-build-verify.md)

Finalize `storybook:build` configuration, ensure artifacts emit to `pkgs/storybook/dist`, and outline checks for verifying key HTML/CSS/JS bundles and component coverage in the static output.

## Questions

### Storybook Builder Preference

Should we standardize on the Vite builder (as recommended by Turborepo) or is there an existing requirement to use Webpack/another builder for compatibility with current tooling?

#### Answer

Adopt Storybook's Vite builder as the standard; no additional compatibility requirements for other builders at this time.

## Notes

- Turborepo's Storybook guide will inform dependency choices, script names, and recommended pipeline wiring.
- Components targeted for sample stories rely on React 19 and shared workspace utilities, so Storybook configuration must support ESM and workspace path aliases.
- Keep story availability limited to `pkgs/vsc-webview` and `subs/ds/pkgs/ui` until further expansion.

## Prompt

I want you to plan Storybook integration. Follow the guide: https://turborepo.com/docs/guides/tools/storybook. Instead of apps/storybook, make sure to use `pkgs/storybook`. Update `docs/contributing/pkgs.md` to reflect that.

For now I want the stories only available in `./pkgs/vsc-webview` and `./subs/ds/pkgs/ui`. Add a sample story for `subs/ds/pkgs/ui/src/Button.tsx` in ui and `pkgs/vsc-webview/src/aspects/file/Label.tsx` in vsc-webview.

Validate if it works by building the storybook into static `pkgs/storybook/dist` and checking the files manually.
