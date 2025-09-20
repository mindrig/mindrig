# Author sample stories

## Spec

Create illustrative stories for the UI `Button` and webview `FileLabel` components to validate the Storybook setup and demonstrate conventions for future authors.

## Tasks

- [ ] [Add Button stories](#add-button-stories): Author `Button` stories under the UI package with varied states and controls metadata.
- [ ] [Add FileLabel story](#add-filelabel-story): Create a story for the VS Code webview label component using mocked `SyncFile` data.
- [ ] [Share story utilities](#share-story-utilities): Provide any reusable fixtures or helpers needed by both story sets.

### Add Button stories

#### Summary

Demonstrate key Button variants from the design system package.

#### Description

- Create `subs/ds/pkgs/ui/src/Button.stories.tsx` alongside the component file.
- Define `Meta<typeof Button>` with title `"UI/Button"`, default args for `size`, `color`, and `style`, plus control definitions for storybook UI.
- Implement at least three named stories (e.g., `Primary`, `Secondary`, `WithIconTag`) showcasing icons, tags, and slot usage.
- Export `argTypes` to expose `size`, `color`, and `style` controls, ensuring the story compiles with React 19 typings.

### Add FileLabel story

#### Summary

Showcase the file label renderer with realistic props.

#### Description

- Create `pkgs/vsc-webview/src/aspects/file/Label.stories.tsx` colocated with the component.
- Mock a minimal `SyncFile.State` object (id, languageId, path) either inline or via a helper so the component renders without external dependencies.
- Include multiple stories (e.g., `Default`, `DifferentLanguage`) to cover icon variations and long filenames.
- Ensure the story imports the component using relative paths and reuses global styles established in Step 3.

### Share story utilities

#### Summary

Avoid duplicating fixtures for future stories.

#### Description

- If mocking helpers grow beyond a few lines, add `pkgs/storybook/src/mocks/file.ts` (or similar) exporting factory functions for `SyncFile.State` instances.
- Update both story files to import shared mocks and document their usage in a top-of-file comment.
- Add an `index.ts` in `pkgs/storybook/src` if needed to consolidate reusable story utilities.

## Questions

None.

## Notes

- Keep stories colocated with their components as required by the brief; do not add stories inside `pkgs/storybook` itself.
