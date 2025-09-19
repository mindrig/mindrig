# Update dependency references

## Spec
Update imports, dependency declarations, and tooling references to match the renamed packages and new paths so the workspace builds without broken links.

## Tasks

- [ ] [Rewrite npm dependencies](#rewrite-npm-dependencies): Update `dependencies`/`devDependencies` entries across the workspace to use the new package names.
- [ ] [Update Rust references](#update-rust-references): Adjust Rust `use` statements and `Cargo.toml` entries to the renamed crates.
- [ ] [Refresh tooling configs](#refresh-tooling-configs): Fix path aliases, build scripts, and CI configs that hardcode old package names or locations.
- [ ] [Verify references](#verify-references): Run targeted searches and builds to ensure no stale references remain.

### Rewrite npm dependencies
#### Summary
Point package manifests at the renamed packages.
#### Description
- Use `rg '@mindcontrol' --files-with-matches` (or similar) to find old package name references.
- Edit each affected `package.json` to depend on the new names (e.g., `@wrkspc/vsc-sync`).
- Update scripts or workspace filters (e.g., in `turbo.json`) that filter by the old package names.

### Update Rust references
#### Summary
Align Rust code with the new crate names.
#### Description
- Search for `mindcontrol_code_parser`/`mindcontrol_code_types` in `parser/src`, `parser/tests`, and related crates.
- Replace imports and crate references with `mindrig_parser`, `wrkspc_types`, etc., matching the new manifest names.
- Run `cargo fmt` to tidy up after edits.

### Refresh tooling configs
#### Summary
Ensure tooling uses the relocated paths.
#### Description
- Update TypeScript path aliases (e.g., `vscode/extension/tsconfig.json`) to point at `../../pkgs/...` locations.
- Adjust bundler/test configs (`vite.config.ts`, `playwright.config.ts`, CI workflows) with new import paths or package names.
- Regenerate any generated artifacts (e.g., `parser/scripts/build.sh` outputs) that embed old paths.

### Verify references
#### Summary
Confirm the codebase no longer references old package names or paths.
#### Description
- Run `rg '@mindcontrol'` and `rg '../parser'` across the repo to ensure no stale references remain.
- Execute `pnpm lint` / `pnpm test` filtered to affected packages and `cargo check` to catch missing dependencies.
- Document any lingering issues in the plan notes for follow-up.

## Questions
None.

## Notes
- Coordinate this step closely with manifest changes to avoid mismatched dependency names in the interim.
