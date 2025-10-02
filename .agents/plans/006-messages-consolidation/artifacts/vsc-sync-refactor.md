# VSC Sync Refactor Notes

## Current Exports

- `src/message.ts` defines the `SyncMessage` discriminated union with nested namespace members `SyncMessage.Update`, `SyncMessage.StateVector`, and `SyncMessage.Init`; payload `type` strings already in kebab-case (e.g., `sync-update`).
- `src/resource.ts` exposes `SyncResource.Code` with `type: "code"` and `path` string. `SyncResource` is a union alias currently identical to `SyncResource.Code`.
- `src/file.ts` and `src/text.ts` provide helpers for working with Yjs documents (file snapshot conversions, text diffs).
- `src/index.ts` re-exports `file`, `message`, `resource`, and `text` modules directly (no namespacing / barrel beyond flat star exports).

## Downstream Usage Snapshot

- Extension (`pkgs/vsc-extension/src/WorkbenchView/Provider.ts`, `CodeSyncManager.ts`, `FileManager.ts`) imports `SyncMessage`, `SyncFile`, and `SyncResource` directly from `@wrkspc/vsc-sync`.
- Webview (`pkgs/vsc-webview/src/hooks/useCodeSync.ts`, `app/Index.tsx`, several aspect components/tests) references `SyncMessage` union members and `SyncFile.State` helpers.
- Storybook and tests also refer to `SyncFile` / `SyncMessage` naming, meaning renames must propagate across both runtime and test code.

## Observations

- `SyncMessage` currently implemented as ambient namespace pattern; renaming to `VscMessageSync` will require updating both the exported type alias and the namespace declaration.
- No explicit `SyncMessageType` alias exists yet—only the discriminated union—simplifying the rename surface.
- Directory structure is flat; plan step requires moving message-related definitions under a messages folder without breaking existing helper exports (`file.ts`, `text.ts`).
- No backwards compatibility alias exists today; will consider temporary alias only if migration becomes too invasive but default is to remove the old name entirely.

## Next Steps

1. Rename `SyncMessage` namespace/union → `VscMessageSync` and adjust downstream imports.
2. Relocate message/type exports under `src/messages/` with updated barrel.
3. Update `@wrkspc/vsc-sync` index to export new modules and ensure type paths match build expectations.

## Changes Applied

- Renamed `SyncMessage` union/namespace to `VscMessageSync` and relocated definitions to `src/messages/sync.ts`.
- Updated package barrel (`src/index.ts`) to re-export from the new messages module.
- Removed legacy `src/message.ts` to avoid stale aliases.
- Adjusted all package consumers (extension + webview) and tests to reference `VscMessageSync` and reran unit suites.
