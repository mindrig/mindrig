# Inventory existing packages

## Spec

Establish a complete inventory of all packages in the repository, capturing type, manifest metadata, current names, privacy flags, and descriptions so later relocation and manifest updates have a reliable source of truth.

## Tasks

- [ ] [Catalog pkgs directory](#catalog-pkgs-directory): Record every package already under `./pkgs` with key manifest data.
- [ ] [Inspect legacy locations](#inspect-legacy-locations): Document packages still outside `./pkgs`, including their manifest paths and current names.
- [ ] [Collect metadata snapshots](#collect-metadata-snapshots): Extract names, descriptions, privacy/publish settings, and entry points from each manifest for use in later steps.
- [ ] [Draft inventory summary](#draft-inventory-summary): Produce a structured list or table that can feed directly into docs updates and cross-checks.

### Catalog pkgs directory

#### Summary

Enumerate existing packages already under `./pkgs` to understand the baseline structure.

#### Description

- Use `ls ./pkgs` and inspect each folder for `package.json` or `Cargo.toml`.
- Capture package type (npm vs. Cargo) and note if any packages already follow the new naming scheme.
- Record relative paths for future documentation links.

### Inspect legacy locations

#### Summary

Identify all packages still outside the consolidated directory.

#### Description

- Traverse `./parser`, `./types`, and `./vscode/*` folders to confirm contents and manifest files.
- Note any build scripts or configs referencing these directories.
- Flag potential conflicts (e.g., name collisions with entries already under `./pkgs`).

### Collect metadata snapshots

#### Summary

Extract actionable metadata from manifests to guide renaming and privacy changes.

#### Description

- For npm packages, note `name`, `version`, `private`, `description`, `main`, `types`, `exports`, and notable scripts.
- For Cargo crates, note `package.name`, `edition`, `publish`, and crate type.
- Store findings in a temporary planning artifact (e.g., `plans/001-pkg-consolidation/inventory.md`) if needed for reference.

### Draft inventory summary

#### Summary

Synthesize the gathered data into an execution-ready reference.

#### Description

- Organize findings into a table or bullet list keyed by future package path.
- Highlight discrepancies (e.g., missing descriptions) that require follow-up during documentation updates.
- Ensure the summary clearly distinguishes npm vs. Cargo packages.

## Questions

None.

## Notes

- Consider automating metadata extraction with a small script if manual inspection becomes unwieldy.
- Keep interim notes within the `plans/001-pkg-consolidation` directory.
