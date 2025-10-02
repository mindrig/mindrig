# Prompt Pinning Feature

## Brief

Design a fresh prompt pinning experience in the VS Code webview that adds a pin toggle in the file header, keeps the chosen prompt visible, and replaces the legacy file pinning implementation.

## Steps

- [x] [Strip Legacy File Pinning](./001-strip-legacy-file-pinning.md): Remove the existing file pin state, messages, and UI so the extension and webview no longer coordinate on file pinning.
- [x] [Implement Prompt Pin Controls](./002-implement-prompt-pin-controls.md): Introduce a pin icon toggle in `FileHeader` and manage pinned prompt state within the webview.
- [x] [Enforce Prompt Panel Behavior](./003-enforce-prompt-panel-behavior.md): Ensure the blueprint always renders the pinned prompt source, add overrides for user settings, and validate the new flow with focused React tests (Testing Library + happy-dom) while disabling the broader webview unit suite per guidance.

### [Strip Legacy File Pinning](./001-strip-legacy-file-pinning.md)

- Audit `pkgs/vsc-webview` and `pkgs/vsc-extension` for pin-related state (`pinnedFile`, `pinFile`, `pinStateChanged`, etc.) and remove the associated message handling.
- Simplify `FileHeader` props and layout by deleting file pin UI remnants and ensuring file metadata still renders correctly.
- Verify no other packages export or rely on pinning helpers; clean up types and events accordingly.

### [Implement Prompt Pin Controls](./002-implement-prompt-pin-controls.md)

- Add a pin icon toggle ahead of the prompt selector, defaulting to unpinned, and wire it to local state in `Index`.
- Capture the currently resolved prompt and related file context when the user pins, and keep that reference stable until unpinned.
- Surface the pinned state back into `FileHeader` so the icon reflects the current mode, including hover states and accessibility labels.

### [Enforce Prompt Panel Behavior](./003-enforce-prompt-panel-behavior.md)

- Update `Blueprint` (and any dependent components) to display `PromptSource` whenever the pin state is active, bypassing `settings.playground.showSource`.
- Ensure prompt selection changes or file/cursor updates do not overwrite the pinned prompt until unpinned, while keeping assessments in sync.
- Add targeted React tests with Testing Library + happy-dom to cover the pinned prompt behavior, explicitly disabling the legacy webview unit suite to avoid flakiness.

## Questions

### Pin icon source

Should the pin icon come from an existing icon set in the project (e.g., Blueprint, Heroicons, custom SVG), or should we design/import a new asset?

#### Answer

Use the existing `Icon` component with `iconRegularThumbtack` when unpinned and `iconSolidThumbtack` when pinned.

### Pinned state persistence

- When the webview reloads or the user closes and reopens the panel, should the prompt pin state reset to unpinned, or do we need to persist it through extension state?

#### Answer

Persist the pinned prompt state so it survives webview reloads or panel reopen events.

### Prompt selector behavior while pinned

If the user manually changes the prompt via the dropdown while pinned, should the visible prompt stay on the pinned one, or should the selection update and re-pin to the new choice?

#### Answer

If the user selects a different prompt while pinned, immediately switch to that prompt and keep it pinned.

## Notes

- Removing the legacy pin flow requires pruning `pinFile` messaging across the extension and webview so no stale events linger.
- The new prompt pin should live entirely within the webview unless persistence is requested; no extension changes are planned beyond clean-up.
- Ignore flaky e2e extension tests and disable the existing webview unit suite while introducing the new targeted tests.

## Prompt

Plan pinning feature. Use 005 index as we're working on something else in parallel.

We used to have an ability to pin a certain file and allow user switch files without losing the focus on the pinned file. I want to work this feature and allow pinning a prompt in webview.

Add to FileHeader component and a pin icon before "Select prompt" select. It must be unchecked by default. When user clicks on it, it must keep the current prompt panel and display PromptSource component inside of Blueprint regardless of the user settings when user switches to another prompt or file.

When user unchecks the pin icon, it must restore the previous behavior and show prompt panel according to the user settings and current cursor position.

Remove the previous implementation of pinning completely and do it from scratch, so we don't have any legacy code.
