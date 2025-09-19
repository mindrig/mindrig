# Normalize package manifests

## Spec

Detail the manifest-level updates required after relocation so that each package reflects its new name, privacy status, and workspace configuration without breaking builds or publish settings.

## Tasks

- [ ] [Audit manifest fields](#audit-manifest-fields): Record current manifest fields that must change to meet the new naming schema.
- [ ] [Define naming updates](#define-naming-updates): Specify the exact `name` values for npm packages and crate names for Rust packages.
- [ ] [Set privacy and publish rules](#set-privacy-and-publish-rules): Establish desired `private`, `publish`/`publishConfig`, and access settings per package.
- [ ] [Align workspace metadata](#align-workspace-metadata): Ensure workspace-specific fields (e.g., `packageManager`, path references) remain valid after edits.
- [ ] [Plan manifest validation](#plan-manifest-validation): Describe the checks required to confirm manifests are consistent post-update.

### Audit manifest fields

#### Summary

Pinpoint every manifest property affected by the move so edits are exhaustive.

#### Description

- Compare `package.json` fields (scripts, bin entries, exports, references) before and after relocation.
- For Cargo crates, review `[package]` and `[lib]/[bin]` sections plus workspace membership.
- Create a checklist of fields needing confirmation once edits are applied.

### Define naming updates

#### Summary

Map new canonical names to each package.

#### Description

- Apply `mindrig_parser` to the relocated parser crate/package.
- Use `@wrkspc/{{pkg}}` names for private npm packages, retaining `vscode` for the extension package as required.
- Confirm whether any Cargo crate names need underscores vs. hyphens based on existing conventions.

### Set privacy and publish rules

#### Summary

Ensure manifests reflect the directive that packages are private by default.

#### Description

- For npm packages, set `"private": true` and configure `publishConfig` if future publishing is anticipated.
- For packages that must remain public (e.g., shared crates), document rationale and required publish settings.
- For Cargo crates, adjust the `publish` field to `false` where appropriate.

### Align workspace metadata

#### Summary

Keep workspace tooling aligned with the renamed packages.

#### Description

- Confirm that `pnpm` `packageManager` versions and `engines` fields remain consistent across manifests.
- Update any relative path references (e.g., `./dist`, `./out`) that might change due to directory depth adjustments.
- Ensure `tsconfig` path aliases, lint configs, and build outputs still point to valid locations.

### Plan manifest validation

#### Summary

Define how to verify manifest edits.

#### Description

- Plan to run `pnpm install` and potentially `pnpm lint`/`pnpm test` after updates.
- For Cargo crates, schedule `cargo check` or targeted builds.
- Document expected outcomes to confirm the manifests are correct.

## Questions

None.

## Notes

- Keep original manifest configurations accessible for quick diffing during execution.
- Consider batching manifest updates with directory moves to reduce intermediate breakage.
