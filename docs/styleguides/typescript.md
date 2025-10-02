# TypeScript Style Guide

## File Naming

- Use `.ts` for TypeScript files and `.tsx` for files containing JSX.
- Stick to camelCase for file names, e.g. `moduleName.ts`, except for class and component files which should use PascalCase, e.g. `Button.tsx` or `UserService.ts`.

## Monorepo

See general monorepo package guidelines in [monorepo.md](./monorepo.md).

Packages should default to private and have `"private": true` in their `package.json`. Only allowlist packages that are meant to be reused outside the monorepo should be public.

For private packages use `@wrkspc` namespace, for public `@mindrig`, unless there's a specific reason to use a different namespace or no namespace at all.

## Testing

Use [Vitest](https://vitest.dev/guide/) for unit and integration tests. For React components, use [React Testing Library](https://testing-library.com/docs/) paired with [Happy DOM](https://github.com/capricorn86/happy-dom).

### Test File Naming

- Prefer naming test files with a `.test.ts` or `.test.tsx` suffix, e.g. `moduleName.test.ts` or `ComponentName.test.tsx` next to the file being tested.
- If tests are for a whole module, place them in the root of the module folder, e.g. `moduleName/test.ts`.
- If tests are for a specific feature or flow, please them in `__tests__` folder, e.g. `src/__tests__/featureFlow.test.ts`.

## Types

- Prefer `interface` for defining object shapes and `type` for unions, intersections, and primitive aliases.
- Use `namespace` to define related types, but never for values.
- Use string literals over enums. When needed to access list of values, use `as const` arrays and `typeof` to derive union types.
- When naming generic type parameters, prefer verbose names like `Item` instead of single letters like `T`.
- When defining nested structures, define inner types separately for clarity.
