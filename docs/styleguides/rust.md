# Rust Style Guide

## File Naming

- Use `.rs` for Rust files.
- Stick to snake_case for file names, e.g. `module_name.rs`.

## Monorepo

See general monorepo package guidelines in [monorepo.md](./monorepo.md).

Packages should default to private and have `publish = false` in their `Cargo.toml`. Only allowlist packages that are meant to be reused outside the monorepo should be public.

For private packages use `wrkspc_` prefix, for public `mindrig_`, unless there's a specific reason to use a different prefix or no prefix at all.

### New Package

When adding a new package, create a new directory `pkgs/{{pkg_dir_name}}` and add it to the workspace in the root `Cargo.toml`.

## Testing

- Prefer in-file tests with a dedicated `mod tests` section.
- Use `pretty_assertions` crate for better assertion messages.
- When testing large data structures, consider using `insta` crate for snapshot testing. Stick to inline snapshots when possible, i.e. `assert_debug_snapshot!(data, @"")`.
