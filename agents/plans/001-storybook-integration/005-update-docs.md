# Update contributor docs

## Spec

Refresh `docs/contributing/pkgs.md` so contributors know how to run, locate, and extend Storybook via `pkgs/storybook`.

## Tasks

- [ ] [Review existing docs section](#review-existing-docs-section): Understand current contributor guidance around packages and UI development.
- [ ] [Document Storybook usage](#document-storybook-usage): Add commands and workflow instructions for running Storybook locally and building statically.
- [ ] [Explain story ownership](#explain-story-ownership): Clarify where stories live, naming conventions, and expectations for new components.

### Review existing docs section

#### Summary

Capture current contributor context before editing.

#### Description

- Open `docs/contributing/pkgs.md` and note any existing references to Storybook or component previews.
- Identify the best section (e.g., "UI Packages" or "Testing") to insert new Storybook guidance without duplicating content.
- Log current headings in `agents/plans/001-storybook-integration/artifacts/docs-notes.md` for quick reference.

### Document Storybook usage

#### Summary

Describe how to run and build the new Storybook package.

#### Description

- Add a subsection (e.g., "Storybook") covering `pnpm --filter @wrkspc/storybook storybook:dev` and `storybook:build` commands, including default ports and environment variables.
- Mention that the static build outputs to `pkgs/storybook/dist` and should be inspected before PRs.
- Outline any prerequisite setup (Node/PNPM versions, ensuring dependencies are installed) pulled from Step 1’s audit.

### Explain story ownership

#### Summary

Set expectations for where stories reside and how to add new ones.

#### Description

- Spell out that stories live alongside components in their respective packages (currently limited to `pkgs/vsc-webview` and `subs/ds/pkgs/ui`).
- Note the naming convention (`*.stories.tsx`) and encourage colocated mocks/helpers when appropriate.
- Add guidance for requesting Storybook support for new packages (e.g., open an issue or update story globs in `.storybook/main.ts`).

## Questions

None.

## Notes

- Keep documentation concise but actionable; link to Turborepo’s Storybook guide for deeper background if useful.
