# Relocate legacy packages

## Spec

Move the remaining legacy packages into `./pkgs` with their final directory names so the repository has a single, consistent package layout.

## Tasks

- [x] [Assess destination conflicts](#assess-destination-conflicts): Compare each legacy package with its target `./pkgs` folder and decide whether to merge, replace, or archive existing contents.
- [x] [Move packages into place](#move-packages-into-place): Use `git mv` to relocate the legacy directories into the `./pkgs` tree with the correct slugs.
- [x] [Clean up leftovers](#clean-up-leftovers): Remove obsolete folders, regenerate missing shim directories, and note any manual merges that remain.

### Assess destination conflicts

#### Summary

Determine how to reconcile existing `./pkgs/*` folders with the incoming moves.

#### Description

- For each target (`parser`, `types`, `vsc-extension`, `vsc-sync`, `vsc-types`, `vsc-webview`), run `diff -qr pkgs/<target> <legacy-path>` (or inspect manually) to understand differences.
- Document the strategy (replace, merge specific files, preserve assets) in `.agents/plans/001-pkg-consolidation/artifacts/relocation-notes.md`.
- If any `pkgs/*` directories contain generated artifacts only, schedule their removal prior to the move.

### Move packages into place

#### Summary

Perform the actual directory relocations with history preserved.

#### Description

- For each legacy directory, run the appropriate `git mv` to its new location and slug, e.g., `git mv parser pkgs/parser`.
- Ensure the `types` sub-packages (`pkg/ts`, `pkg/rs`) end up under `pkgs/types` in their expected layout.
- After each move, run `git status` (read-only) or `ls` to confirm files are present and remove any stray empty folders.

### Clean up leftovers

#### Summary

Leave the workspace without duplicate or empty directories.

#### Description

- Delete now-empty legacy directories (`parser`, `types`, `vscode/*`) once their contents live under `pkgs/`.
- Restore any required parent directories (e.g., if `vscode/` must remain for other assets) with appropriate `.gitkeep` files.
- Update `artifacts/relocation-notes.md` with any outstanding follow-up (e.g., files that need manual merging in later steps).

## Questions

None.

## Notes

- Perform moves in a single window to minimise broken imports between steps.
- If conflicts arise during `git mv`, resolve immediately and document the resolution in `artifacts/relocation-notes.md`.
