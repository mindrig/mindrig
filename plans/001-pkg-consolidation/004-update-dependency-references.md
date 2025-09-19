# Update dependency references

## Spec

Plan the exhaustive updates required to align imports, dependency declarations, build scripts, and configuration files with the new package names and locations.

## Tasks

- [ ] [Map dependency surfaces](#map-dependency-surfaces): Identify all places where old package names or paths are referenced.
- [ ] [Update npm dependency declarations](#update-npm-dependency-declarations): Define the changes needed in `package.json` dependency sections across the workspace.
- [ ] [Update Rust dependency references](#update-rust-dependency-references): Capture required adjustments in Cargo manifests and `use` statements.
- [ ] [Adjust tooling and build scripts](#adjust-tooling-and-build-scripts): Plan edits for CI, Turbo, scripts, and environment configs that depend on the old structure.
- [ ] [Coordinate module alias changes](#coordinate-module-alias-changes): Outline updates to TypeScript path mappings, bundler configs, and any shared code references.

### Map dependency surfaces

#### Summary

List every area where the renamed packages are consumed.

#### Description

- Use `rg` searches for old package names (e.g., `"parser"`, `@wrkspc/types`) and legacy paths (`../parser`).
- Include documentation, scripts, and configuration files in the search scope.
- Produce a checklist tying each reference to the file(s) that must be updated.

### Update npm dependency declarations

#### Summary

Capture `package.json` dependency section edits needed across npm packages.

#### Description

- For each workspace package, record the new dependency name and version spec.
- Ensure dependencies that should be `dependency` vs. `devDependency` are categorized correctly (notably for `vsc-extension`).
- Note if any peer or optional dependencies must change to match new names.

### Update Rust dependency references

#### Summary

Ensure Cargo-related references stay accurate.

#### Description

- Update `[dependencies]`, `[dev-dependencies]`, and `[workspace.dependencies]` entries for renamed crates.
- Identify any `use mindrig_parser::...` statements needing path updates.
- Plan to run `cargo fmt`/`cargo check` post-update to validate.

### Adjust tooling and build scripts

#### Summary

Keep automation aligned with the new structure.

#### Description

- Review `turbo.json`, CI workflows, and custom scripts for references to legacy directories.
- Update environment variable docs or `.env` samples if paths change.
- Ensure any bundle output directories or watch scripts follow the new layout.

### Coordinate module alias changes

#### Summary

Track updates to alias and import helper configurations.

#### Description

- Update `tsconfig.base.json`/`tsconfig.json` path mappings to new package names.
- Adjust webpack/Vite/esbuild config aliases if applicable.
- Verify `pnpm` workspace protocol references remain correct.

## Questions

None.

## Notes

- Keep dependency updates in sync with manifest edits to avoid transient mismatch errors.
- Consider automation (e.g., codemods) if reference counts are high.
