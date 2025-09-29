# Adopt Streamdown markdown rendering

## Spec

Replace the current markdown rendering stack with Streamdown so result cards can display streaming markdown updates with consistent styling and sanitization.

## Tasks

- [ ] [Add Streamdown dependency](#add-streamdown-dependency): Install `streamdown` (and peer packages) in the webview package and remove the existing markdown preview dependency.
- [ ] [Create streaming markdown component](#create-streaming-markdown-component): Build a wrapper component that feeds streaming text updates into Streamdown and exposes a simple API for result cards.
- [ ] [Integrate component into result rendering](#integrate-component-into-result-rendering): Swap usages of `MarkdownPreview` in `Assessment` with the new Streamdown-based component while preserving the raw-text toggle.
- [ ] [Align styles and theming](#align-styles-and-theming): Ensure Streamdown output matches existing typography, code block styling, and dark/light themes.
- [ ] [Verify security and sanitization](#verify-security-and-sanitization): Confirm Streamdown's sanitization covers our needs and document any additional configuration or CSP considerations.

### Add Streamdown dependency

#### Summary

Bring Streamdown into the project and remove the legacy renderer.

#### Description

- Add `streamdown` to `pkgs/vsc-webview/package.json` along with any required peer packages (e.g., syntax highlighters).
- Remove `@uiw/react-markdown-preview` and related styles from dependencies.
- Run `pnpm install` to update the lockfile and ensure the build still succeeds.

### Create streaming markdown component

#### Summary

Encapsulate Streamdown usage behind a reusable component.

#### Description

- Add a component (e.g., `StreamingMarkdown.tsx`) that accepts the latest text, incremental chunks, or a stream reference and renders via Streamdown.
- Handle resetting state when a new run/result id arrives to avoid accumulating old content.
- Expose props for fallback copy (empty states) and raw markdown retrieval for debugging.

### Integrate component into result rendering

#### Summary

Use the new component inside result cards.

#### Description

- Update `Assessment`'s result rendering logic to render Streamdown output when the "Markdown" tab is active.
- Ensure the "Raw" view continues to show the concatenated text without Streamdown processing.
- Confirm streaming updates trigger re-renders without layout thrash.

### Align styles and theming

#### Summary

Match current look and feel.

#### Description

- Map existing typography, spacing, and code block styles to Streamdown's class names or provide custom renderers.
- Test in both light and dark themes to ensure contrast remains acceptable.
- Update any global CSS or Tailwind utilities needed to style Streamdown elements (e.g., inline code, tables).

### Verify security and sanitization

#### Summary

Ensure rendered content is safe.

#### Description

- Review Streamdown's sanitization defaults for script/style stripping and adjust configuration if necessary.
- Confirm CSP settings in the webview still allow required assets while blocking inline scripts.
- Document any residual risks or follow-up tasks in the Notes section for Step 5.

## Questions

None.

## Notes

- Coordinate with assessment layout changes so placeholder skeletons and streamed markdown share consistent spacing.
- Plan to remove any custom markdown CSS no longer needed after Streamdown adoption.
