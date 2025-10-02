# Monorepo Structure

For language-specific guidelines see:

- [TypeScript Style Guide/Monorepo](./typescript.md#monorepo).
- [Rust Style Guide/Monorepo](./rust.md#monorepo).

## Naming

All of the packages in this repository are located in the `pkgs/{{pkg_dir_name}}` directory. The directory name should be in `kebab-case`, e.g. `vsc-webview` regardless of the package name case, i.e. Rust package names are in `snake_case`, e.g. `wrkspc_parser_py`, but the directory should still be `parser-py`. The common prefix (i.e. `@wrkspc/` and `@mindrig/` for TypeScript or `wrkspc_`and`mindrig_`) should be omitted from the directory name.
