# Mindrig Package Consolidation

## Brief

### Summary

Consolidate all Mindrig packages under `./pkgs`, align naming with the new schema, ensure manifests and dependency references stay consistent, and document the final structure for contributors.

### Original Prompt

I want to plan package consolidation. I want all the packages to be inside the `./pkgs` directory. I want you to apply consistent naming for each of them. We started adding new packages there, but we still have the following packages that don't follow the new approach.

- `./parser`: move to `./pkgs/parser`; rename to `mindrig_parser`.

- `./types`: move to `./pkgs/types`, rename to `@wrkspc/types`.

- `./vscode/extension`: move to `./pkgs/vsc-extension`, right now it has the name `vscode` as it is used to build the package id (`mindcontrol.vscode`), so keep it as is for now.

- `./vscode/sync`: move to ` ./pkgs/vsc-sync`, rename to `@wrkspc/vsc-sync`.

- `./vscode/types`: move to `./pkgs/vsc-types`, rename to `@wrkspc/vsc-types`.

- `./vscode/webview` move to `./pkgs/vsc-webview`, rename to `@wrkspc/vsc-webview`.

Make sure to update all names in the dependencies. You can check if everything is in order by running `pnpm install`.

Ensure that npm packages following the `@wrkspc/{{pkg-name}}` schema are all private.

Document the naming schema inside `./docs/contributing/pkgs.md`: `@wrkspc/{{pkg-name}}` for private npm packages, `@mindrig/{{pkg-name}}` for public npm packages, `wrkspc_pkg_name` for private crates, `mindrig_pkg_name` for public crates. All packages must be private by default, unless it must be a `dependency` (not a `devDependency`!) of `vscode` (`./pkgs/vsc-extension`) or there's a sense to make it public, e.g., to share code with another project, or if it makes sense as an open-source project.

List all the packages inside `./pkgs` and, using the description from `package.json` or `Cargo.toml` add the packages list to `./docs/contributing/pkgs.md` with the path as a markdown link, the package name, and a brief description. Use the following as the example:

```
## Packages

The npm packages and crates are located in [`./pkgs`](./pkgs) directory:

[`@wrkspc/model`](./pkgs/model): AI models aspect. Provides type and utils to working with models: ids, metadata, options, etc.
 ...
```

## Plan

- [ ] [Inventory existing packages](./001-inventory-existing-packages.md): Catalog current packages in `./pkgs` and legacy locations, noting names, visibility, and manifest metadata.
- [ ] [Relocate legacy packages](./002-relocate-legacy-packages.md): Move remaining legacy folders into `./pkgs` with correct directory slugs and resolve any duplicates or conflicts.
- [ ] [Normalize package manifests](./003-normalize-package-manifests.md): Update package manifests (`package.json`, `Cargo.toml`, etc.) with new names, privacy flags, and workspace settings.
- [ ] [Update dependency references](./004-update-dependency-references.md): Adjust internal imports, workspace references, build tooling, and scripts to reference the renamed packages.
- [ ] [Document and verify](./005-document-and-verify.md): Refresh contributor docs, add package list entries, ensure naming schema guidance is present, and validate via `pnpm install`.

## Steps

### [Inventory existing packages](./001-inventory-existing-packages.md)

Run the commands that capture current package directories and manifest metadata, committing the results to the inventory artifacts so later steps operate on accurate data.

### [Relocate legacy packages](./002-relocate-legacy-packages.md)

Resolve conflicts between existing `pkgs/*` folders and legacy sources, then move each package into its final location under `./pkgs` and remove the old directories.

### [Normalize package manifests](./003-normalize-package-manifests.md)

Rename package/crate manifests, update workspace configuration files, and enforce privacy settings to reflect the new directory layout.

### [Update dependency references](./004-update-dependency-references.md)

Replace imports, dependency declarations, and tooling references so every consumer points to the renamed packages and crates.

### [Document and verify](./005-document-and-verify.md)

Update contributor documentation with the new naming scheme and package list, then run verification commands and draft rollout notes.

## Questions

None at this time.

## Notes

- Prioritize minimizing downtime for `./pkgs/vsc-extension` because of its role in building the VS Code extension ID.
- Ensure Rust crates and npm packages follow workspace tool expectations (e.g., Cargo workspaces, pnpm workspace file) after moves.
