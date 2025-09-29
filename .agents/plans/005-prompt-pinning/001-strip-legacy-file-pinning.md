# Strip legacy file pinning

## Spec

Remove every vestige of the old file-based pin experience from both the webview and the extension so the new prompt pin feature starts from a clean slate.

## Tasks

- [ ] [Purge webview pin state](#purge-webview-pin-state): Delete `pinnedFile`/`isPinned` state, message handlers, and UI controls from `pkgs/vsc-webview/src/app/Index.tsx` and `aspects/file/Header.tsx`.
- [ ] [Remove extension pin wiring](#remove-extension-pin-wiring): Excise `pinFile`/`unpinFile` message handling from `pkgs/vsc-extension/src/WorkbenchView/Provider.ts` and associated helpers in `FileManager.ts`.
- [ ] [Clean shared types and tests](#clean-shared-types-and-tests): Update any shared types, mocks, or tests referencing file pinning and ensure the build passes without the legacy code.

### Purge webview pin state

#### Summary

Strip out legacy pin logic from the React app.

#### Description

- Use `rg "pinnedFile" pkgs/vsc-webview/src` to locate all references.
- Remove the state hooks, message handling branches, and props that existed purely for file pinning.
- Delete the "Pin"/"Unpin" button in `FileHeader` along with any conditional rendering tied to file pinning.

### Remove extension pin wiring

#### Summary

Stop the extension from sending or responding to file pin messages.

#### Description

- Search for `pinFile`/`unpinFile` in `pkgs/vsc-extension/src`.
- Remove the `case` statements in `WorkbenchView/Provider.ts` and delete the corresponding handler methods.
- Drop pinning helpers (`pinCurrentFile`, `unpinFile`, related fields) from `FileManager.ts`, ensuring no build-time references remain.

### Clean shared types and tests

#### Summary

Delete leftover references across shared layers.

#### Description

- Update any types or message enums that listed `pinStateChanged` or similar payloads.
- Adjust mocks under `pkgs/vsc-webview/src/__tests__/mocks` and integration tests to stop expecting pin events (or delete the expectations entirely).
- Run `pnpm lint` at the repo root to confirm TypeScript builds after the purge (tests can be skipped for now).

## Questions

None.

## Notes

- Keep an eye out for comments referencing the old pin feature—remove or rewrite them to avoid confusion later.
