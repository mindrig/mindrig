# Implement prompt pin controls

## Spec

Add a thumbtack toggle in the file header that captures the currently resolved prompt, keeps it pinned via webview state persistence, and surfaces the mode back to the UI.

## Tasks

- [x] [Model pinned prompt state](#model-pinned-prompt-state): Define React state in `pkgs/vsc-webview/src/app/Index.tsx` to track the pinned prompt metadata and load/save it with `vscode.getState`/`setState`.
- [x] [Render thumbtack toggle](#render-thumbtack-toggle): Replace the legacy file pin button in `FileHeader` with the shared `Icon` component (`iconRegularThumbtack`/`iconSolidThumbtack`) positioned before the prompt `Select`.
- [x] [Handle pin/unpin interactions](#handle-pinunpin-interactions): Wire click handlers and prompt selection events so toggling captures or clears the pinned prompt, and dropdown changes while pinned immediately re-pin to the new prompt.
- [x] [Plumb state props](#plumb-state-props): Update component props and context so `FileHeader`, `Blueprint`, and any dependents receive the pinned prompt information without relying on file pin types.

### Model pinned prompt state

#### Summary

Store the pinned prompt details in React state with persistence.

#### Description

- Introduce a `PinnedPromptState` object (e.g., `{ prompt, file, promptIndex }`).
- Initialize it from `vsc.getState()` (via `useVsc`) during `Index` mount and write back with `vsc.setState` whenever the pin status changes.
- Track a boolean `isPromptPinned` derived from whether the pinned state exists.

### Render thumbtack toggle

#### Summary

Add the new icon toggle to the header UI.

#### Description

- Import the shared `Icon` component in `FileHeader`.
- Render a button ahead of the prompt `Select`, showing `iconRegularThumbtack` when unpinned and `iconSolidThumbtack` when pinned.
- Ensure the button has accessible labels/tooltips ("Pin prompt"/"Unpin prompt") and respects focus styles.

### Handle pin/unpin interactions

#### Summary

Make the toggle and prompt selector manage the pinned state.

#### Description

- On pin click, capture the current prompt (using `promptIdx` and the memoized prompt) plus the associated file snapshot and store it in state.
- On unpin click, clear the pinned state and call `vsc.setState(undefined)`.
- Override the prompt `Select` `onSelectionChange` so, if pinned, the new selection updates the pinned state and keeps the toggle active.

### Plumb state props

#### Summary

Propagate the pinned prompt context to interested components.

#### Description

- Update `FileHeader` props to accept `isPromptPinned` and the handlers, removing legacy pin props.
- Provide the pinned prompt to `Blueprint` (e.g., `pinnedPrompt ?? activePrompt`) while keeping the existing memoization logic sane.
- Adjust any intermediate context or hooks to avoid TypeScript errors after the prop changes.

## Questions

None.

## Notes

- Ensure the persisted state schema is resilient to future additions (e.g., include a `version` field if helpful).
- Keep the toggle visually subtle but discoverable; align spacing with existing header controls.
