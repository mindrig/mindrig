# Normalize package manifests

## Spec

Rename packages and crates to follow the new conventions, ensure privacy flags are correct, and update workspace configuration files to match the relocated paths.

## Tasks

- [x] [Rename package manifests](#rename-package-manifests): Update `package.json` files for the moved packages with their new names and adjust supporting metadata.
- [x] [Update workspace configuration](#update-workspace-configuration): Align root-level workspace files (`pnpm-workspace.yaml`, root `package.json`, `turbo.json`) with the new paths.
- [x] [Adjust Cargo manifests](#adjust-cargo-manifests): Rename crates and update dependency paths in `Cargo.toml` files affected by the relocation.
- [x] [Set privacy flags](#set-privacy-flags): Ensure every `@wrkspc/*` package is marked private and add `publish` settings for crates.

### Rename package manifests

#### Summary

Apply the new naming scheme to npm packages.

#### Description

- Edit each moved `package.json` to reflect its new `name` (e.g., `mindrig_parser`, `@mindrig/types`, `@wrkspc/vsc-sync`).
- Update related fields (`description`, `repository`, `bin`/`main` paths) if directory depth changed.
- Run `pnpm pkg fix` or format the JSON to maintain consistency.

### Update workspace configuration

#### Summary

Keep workspace tooling pointing at the relocated packages.

#### Description

- Modify `pnpm-workspace.yaml` to replace legacy globs (`parser`, `vscode/extension`, etc.) with the new `pkgs/*` paths as needed.
- Update the root `package.json` `workspaces` array and any scripts referencing old directories.
- Adjust other tooling configs (e.g., `vitest.config.ts`, `turbo.json`) that enumerate package locations.

### Adjust Cargo manifests

#### Summary

Rename Rust crates and update intra-workspace paths.

#### Description

- Change `[package].name` for affected crates to `mindrig_parser`, `mindrig_types`, etc.
- Update path dependencies (e.g., parser depending on types) to the new `pkgs/...` locations.
- Regenerate `Cargo.lock` (via `cargo metadata` or `cargo check`) after edits to capture the new names.

### Set privacy flags

#### Summary

Enforce the "private by default" policy.

#### Description

- Ensure each `@wrkspc/*` package has "private": true and add a `publishConfig.access = "restricted"` block only when future publishing is expected.
- Confirm the VS Code extension package remains publishable (keep `private: false`) and double-check its marketplace metadata after dependency renames.
- For Rust crates, set `publish = false` (or the appropriate allowlist) unless they are intentionally public.
- Log any intentional exceptions in the plan notes so documentation can mention them explicitly.

## ADRs

- 2025-09-19: The generator workspace under `pkgs/types` retains a dedicated package renamed to `@wrkspc/types-src` so the distributable TypeScript package can use the canonical `@mindrig/types` name without workspace conflicts.
- 2025-09-19: `mindrig_parser` crate keeps publish permissions open pending a future decision; treat it as intentionally public for now.
