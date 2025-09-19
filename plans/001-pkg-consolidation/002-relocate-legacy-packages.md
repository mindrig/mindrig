# Relocate legacy packages

## Spec

Define the precise folder moves and renames required to bring legacy packages into `./pkgs`, ensuring directory slugs align with target names and that build tooling continues to resolve the new paths.

## Tasks

- [ ] [Design move matrix](#design-move-matrix): Map source directories to target `./pkgs` destinations with final package names.
- [ ] [Plan filesystem operations](#plan-filesystem-operations): Outline the commands or scripts needed to move directories and adjust ancillary files.
- [ ] [Assess workspace impacts](#assess-workspace-impacts): Determine updates required to `pnpm-workspace.yaml`, Cargo workspace entries, and tooling configs.
- [ ] [Schedule cleanup](#schedule-cleanup): Plan removal or archival of old paths after verifying successful moves.

### Design move matrix

#### Summary

Establish a definitive mapping from current package locations to their new homes.

#### Description

- List all legacy packages (`./parser`, `./types`, `./vscode/extension`, `./vscode/sync`, `./vscode/types`, `./vscode/webview`).
- For each, specify the destination directory under `./pkgs` and the final package name.
- Note any supporting assets (tests, configs, assets) that need to move along with the package.

### Plan filesystem operations

#### Summary

Detail the sequence of directory moves and renames.

#### Description

- Decide whether to use `git mv` or plain `mv` depending on repository expectations.
- Capture any prerequisite steps (e.g., creating target directories before moving contents).
- Include post-move validation, such as ensuring no empty directories remain in the old locations.

### Assess workspace impacts

#### Summary

Prepare updates to workspace configuration files to reflect new paths.

#### Description

- Identify `pnpm-workspace.yaml` package entries that must change from legacy paths to new `./pkgs` paths.
- Check Cargo workspace settings in `Cargo.toml` that reference moved crates.
- Record any tooling scripts (e.g., `turbo.json`, CI configs) that hardcode paths for these packages.

### Schedule cleanup

#### Summary

Ensure the repository no longer references the legacy paths after relocation.

#### Description

- Plan to remove or empty the old directories once code references are updated.
- Verify that `.gitignore`, CI configs, and documentation do not retain stale paths.
- Document rollback considerations in case the move needs to be undone.

## Questions

None.

## Notes

- Verify whether any symlinks or VS Code-specific build steps rely on the existing `./vscode` hierarchy before performing moves.
- Coordinate move timing with dependency updates to avoid broken imports between commits.
- Consider batching moves to minimize conflicts in long-running feature branches.
