# Inventory existing packages

## Spec

Build an up-to-date snapshot of every relevant package before relocating anything so later steps can make precise edits with confidence.

## Tasks

- [x] [Capture package directories](#capture-package-directories): List all current packages under `./pkgs` and the legacy locations slated for relocation, saving the output to `agents/plans/001-pkg-consolidation/artifacts/inventory.md`.
- [x] [Record manifest metadata](#record-manifest-metadata): Extract `name`, `version`, `private`/`publish`, and descriptions from each package's manifest into `inventory-data.json` and summarize the results in `inventory.md`.
- [x] [Validate inventory artifacts](#validate-inventory-artifacts): Review the collected data for completeness and highlight any anomalies (missing descriptions, duplicates) in the inventory doc.

### Capture package directories

#### Summary

Audit current package folders prior to any moves.

#### Description

- Run `ls pkgs` and `ls parser types vscode/extension vscode/sync vscode/types vscode/webview`.
- Append the command outputs to `agents/plans/001-pkg-consolidation/artifacts/inventory.md` under dated headings.
- Note any unexpected folders that may need follow-up.

### Record manifest metadata

#### Summary

Pull key manifest fields for every target package.

#### Description

- Use `jq` (for `package.json`) and `tomllib`/`cargo metadata` (for `Cargo.toml`) to capture `name`, `version`, `private`/`publish`, and `description`.
- Write structured data to `agents/plans/001-pkg-consolidation/artifacts/inventory-data.json`.
- Summarize each entry in `inventory.md`, grouping by npm packages vs. Cargo crates.

### Validate inventory artifacts

#### Summary

Confirm the inventory files are ready for execution steps.

#### Description

- Skim `inventory.md` to ensure every package slated for relocation is represented with a short description.
- Flag missing information or conflicts directly in the doc (e.g., "TODO: add description for pkgs/gateway").
- Once satisfied, leave a short "Ready" note at the top of the doc with the current date.

## Questions

None.

## Notes

- Re-run these tasks if a long delay occurs before execution so the inventory stays current.
