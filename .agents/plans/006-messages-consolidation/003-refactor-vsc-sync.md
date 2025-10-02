# Refactor Vsc Sync package

## Spec

Rename existing sync message types to the `VscMessageSync` naming scheme, organize exports by domain, and ensure dependent packages compile without behavior changes.

## Tasks

- [x] [Audit current sync exports](#audit-current-sync-exports): Understand how `@wrkspc/vsc-sync` currently structures message types and utilities.
- [x] [Apply VscMessageSync naming](#apply-vscmessagesync-naming): Rename interfaces, enums, and namespaces to the new prefix convention.
- [x] [Restructure module layout](#restructure-module-layout): Group sync message types into domain modules with a root barrel export.
- [x] [Update consumers and tests](#update-consumers-and-tests): Adjust all imports and assertions in dependent packages to the new naming.
- [x] [Verify build and package metadata](#verify-build-and-package-metadata): Ensure package configuration reflects the refactor and publishes the expected entry points.

### Audit current sync exports

#### Summary

Capture the existing file structure and exported symbols for sync messages.

#### Description

- Review `pkgs/vsc-sync/src/message.ts` and related files to list exported types, helper functions, and naming conventions.
- Document findings in `.agents/plans/006-messages-consolidation/artifacts/vsc-sync-refactor.md`, noting any overlapping type aliases or deprecated utilities.
- Identify downstream packages currently importing these exports (use `rg "@wrkspc/vsc-sync"`).

### Apply VscMessageSync naming

#### Summary

Update type names to follow the `VscMessageSync*` convention without altering payload semantics.

#### Description

- Rename root unions (e.g., `SyncMessage`) to `VscMessageSync`, ensuring namespaces or static helpers mirror the name.
- Adjust individual message type names (`SyncMessageType`, `SyncMessagePayloads`, etc.) to match the new prefix and kebab-case `type` strings if necessary.
- Maintain backward compatibility only where unavoidable (e.g., temporary `export type SyncMessage = VscMessageSync`) and document removal timelines if added.

### Restructure module layout

#### Summary

Organize sync message definitions by domain to simplify future imports.

#### Description

- Break large files into smaller modules (e.g., `sync-editor.ts`, `sync-settings.ts`) under `src/messages/` while re-exporting from `src/index.ts` or `src/message.ts`.
- Ensure each module exports the message type, payload interface, and helper constructors for its domain.
- Update tsconfig paths or build tooling if necessary to reflect the new module locations.

### Update consumers and tests

#### Summary

Align all dependent code with the renamed exports.

#### Description

- Use codemods or manual edits to update imports in `pkgs/vsc-extension`, `pkgs/vsc-webview`, and any other packages referencing `@wrkspc/vsc-sync`.
- Refresh unit tests and type assertions to use the new names, ensuring coverage still passes.
- Run targeted builds/tests for affected packages to confirm there are no regressions.

### Verify build and package metadata

#### Summary

Confirm the package compiles and publishes correctly after restructuring.

#### Description

- Review `package.json`, `tsconfig.json`, and build scripts for `@wrkspc/vsc-sync` to ensure entry points reference the new files.
- Update any README or documentation that references old names.
- Execute `pnpm build` (or package-specific build command) and inspect the output to verify exported types align with expectations.

## Questions

None.

## Notes

- Keep temporary compatibility aliases short-lived; capture timelines in the artifact if they must exist.
