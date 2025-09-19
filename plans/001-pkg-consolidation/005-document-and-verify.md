# Document and verify

## Spec

Outline the documentation updates and verification steps needed to communicate the new package structure, enforce naming policies, and confirm the workspace remains healthy after consolidation.

## Tasks

- [ ] [Update naming policy docs](#update-naming-policy-docs): Add the schema guidance to `docs/contributing/pkgs.md`.
- [ ] [Compile package catalog](#compile-package-catalog): Create the package list with paths, names, and descriptions sourced from manifests.
- [ ] [Cross-check privacy defaults](#cross-check-privacy-defaults): Ensure all packages adhere to the "private by default" rule and document any exceptions.
- [ ] [Plan verification commands](#plan-verification-commands): Specify the commands to validate the workspace (`pnpm install`, tests, Cargo checks).
- [ ] [Communicate rollout](#communicate-rollout): Draft notes for changelog, PR description, or team announcement summarizing the consolidation.

### Update naming policy docs

#### Summary

Document the canonical naming schemas for npm packages and crates.

#### Description

- Insert the provided schema (`@wrkspc/{{pkg-name}}`, etc.) into the contributing doc.
- Clarify default privacy expectations and the criteria for making packages public.
- Ensure the section references the new `./pkgs` layout.

### Compile package catalog

#### Summary

Publish the up-to-date package inventory for contributors.

#### Description

- Use data from the inventory step to list each package with a markdown link, name, and description.
- Separate npm packages and Rust crates if it aids clarity.
- Confirm descriptions are accurate; draft succinct summaries if manifests lack one.

### Cross-check privacy defaults

#### Summary

Validate that documentation aligns with actual manifest settings.

#### Description

- Compare the documented privacy status with manifest fields (`private`, `publish`).
- Highlight any intentional exceptions (e.g., packages consumed externally) and justify them in the doc.
- Note follow-up tasks if privacy settings still need adjustment.

### Plan verification commands

#### Summary

Define the health checks to run after consolidation work.

#### Description

- Include `pnpm install` as the primary verification step.
- Add any supplemental commands (`pnpm test`, `pnpm lint`, `cargo check`) necessary to cover touched packages.
- Capture expected runtime or ordering considerations (e.g., run Cargo checks after moving Rust crates).

### Communicate rollout

#### Summary

Ensure stakeholders understand the changes and next steps.

#### Description

- Outline key points for a PR description or internal announcement.
- Note any migration guidance developers must follow when rebasing existing branches.
- Suggest updating issue trackers or project boards if applicable.

## Questions

None.

## Notes

- Coordinate with repo maintainers to publish documentation updates concurrently with the code changes.
- Consider adding a checklist in the PR template referencing the new documentation requirements.
