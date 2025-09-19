# Document and verify

## Spec

Update contributor documentation to describe the new package layout, list all packages with descriptions, and verify the workspace builds cleanly after the consolidation.

## Tasks

- [x] [Update naming schema docs](#update-naming-schema-docs): Add the canonical naming rules to `docs/contributing/pkgs.md`.
- [x] [Publish package catalog](#publish-package-catalog): Insert the package list (path, name, short description) into the contributor doc using the latest inventory data.
- [x] [Cross-check privacy status](#cross-check-privacy-status): Ensure documentation and manifests agree on which packages are private.
- [x] [Run verification commands](#run-verification-commands): Execute the workspace health checks to confirm nothing broke.
- [x] [Communicate changes](#communicate-changes): Draft a PR summary or changelog entry that outlines the consolidation.

### Update naming schema docs

#### Summary

Document the required naming convention for contributors.

#### Description

- Add a "Naming Schema" section to `docs/contributing/pkgs.md` with the private/public rules for npm packages and crates.
- Mention that packages are private by default unless required by `pkgs/vsc-extension` or similar needs.

### Publish package catalog

#### Summary

Provide contributors with an authoritative package list.

#### Description

- Using `artifacts/inventory.md`, write the package list in the contributor doc (markdown links to `./pkgs/...`).
- Fill in missing descriptions by summarizing manifest `description` fields or writing concise explanations.

### Cross-check privacy status

#### Summary

Ensure docs match manifest reality.

#### Description

- Double-check each package's `private`/`publish` flags and ensure the doc highlights any intentional public packages.
- Note exceptions inline in the documentation so readers understand why a package is public.

### Run verification commands

#### Summary

Verify the workspace is healthy after changes.

#### Description

- Run `pnpm install`, `pnpm turbo run lint`, `pnpm turbo run test`, and `cargo check` for affected crates.
- Capture any failures and update the plan or doc with remediation steps.

### Communicate changes

#### Summary

Explain the consolidation to stakeholders.

#### Description

- Draft a PR summary or changelog snippet covering the moves, renames, dependency updates, and verification results.
- Share any follow-up tasks (e.g., publishing the VS Code extension with new dependencies) so they can be tracked.

## Questions

None.

## Notes

- Update contributor docs and communication artifacts in the same commit as the code changes to keep context aligned.
