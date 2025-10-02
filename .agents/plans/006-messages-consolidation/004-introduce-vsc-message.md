# Introduce Vsc Message package

## Spec

Create `@wrkspc/vsc-message` to define higher-level message unions that wrap `VscMessageSync`, organize modules by domain, and expose typed helpers for both extension and webview consumers.

## Tasks

- [x] [Design package API surface](#design-package-api-surface): Decide on exported unions, namespaces, and helper utilities.
- [x] [Scaffold package structure](#scaffold-package-structure): Add the new workspace package with build scripts, tsconfig, and lint/test setup.
- [x] [Implement domain modules](#implement-domain-modules): Define message unions and payload types grouped by feature area.
- [x] [Unify with VscMessageSync](#unify-with-vscmessagesync): Import the sync union and expose a master `VscMessage` type.
- [x] [Add validation tests and docs](#add-validation-tests-and-docs): Ensure type-level expectations are covered and document usage guidelines.

### Design package API surface

#### Summary

Establish the conceptual structure and exported entry points for `@wrkspc/vsc-message`.

#### Description

- Draft an outline in `.agents/plans/006-messages-consolidation/artifacts/vsc-message-design.md` describing target exports (e.g., `VscMessage`, `VscMessageDomains`, factories, guards).
- Decide naming conventions for namespaces/modules (e.g., `VscMessage.prompts`, `VscMessage.file`).
- Determine whether to expose runtime guards or rely solely on TypeScript narrowing.

### Scaffold package structure

#### Summary

Bootstrap the new workspace package with aligned tooling.

#### Description

- Create `pkgs/vsc-message` via `pnpm --filter` scaffolding or manual directory creation, mirroring layout from `pkgs/vsc-sync`.
- Add `package.json`, `tsconfig.json`, and `src/index.ts` with appropriate build/test scripts referencing `tsup` or existing bundlers.
- Wire the package into workspace manifests (`pnpm-workspace.yaml`, `tsconfig.base.json`, etc.) and ensure `turbo.json` has build/test tasks.

### Implement domain modules

#### Summary

Author typed message definitions for each domain beyond sync.

#### Description

- Translate inventory results into domain modules (e.g., `src/prompts/messages.ts`, `src/files/messages.ts`) with discriminated unions and payload interfaces.
- Provide helper factories/validators for constructing message payloads to enforce consistent `type` strings and property presence.
- Export module-level unions and consolidate them in `src/index.ts` for ergonomic imports.

### Unify with VscMessageSync

#### Summary

Combine sync and higher-level message unions into a single exported `VscMessage` type.

#### Description

- Import `VscMessageSync` from `@wrkspc/vsc-sync` and union it with the new domain unions.
- Expose helper guards (e.g., `isVscMessage`) and type-specific narrows (e.g., `isPromptMessage`) where beneficial.
- Ensure `package.json` dependencies include `@wrkspc/vsc-sync` and optional `@wrkspc/vsc-types` for shared payloads.

### Add validation tests and docs

#### Summary

Prove the package works as intended and document how to adopt it.

#### Description

- Add unit tests (likely with Vitest) under `pkgs/vsc-message/src/__tests__` that assert helper functions enforce correct type strings and payloads.
- Include type tests (e.g., `expectTypeOf`) to guarantee unions discriminate correctly.
- Update relevant documentation (`docs/architecture/messages.md` or new README) summarizing module structure, usage examples, and migration notes.

## Questions

None.

## Notes

- Reuse naming conventions established in Step 1 artifacts for domain prefixes to stay consistent across packages.
