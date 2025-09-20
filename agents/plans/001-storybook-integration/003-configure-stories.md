# Configure shared stories

## Spec

Point the new Storybook at stories housed in `pkgs/vsc-webview` and `subs/ds/pkgs/ui`, wiring module resolution, global styles, and addon defaults so both packages render consistently.

## Tasks

- [ ] [Define story globs](#define-story-globs): Limit Storybook discovery to the required packages and remove local placeholders.
- [ ] [Enable workspace path resolution](#enable-workspace-path-resolution): Make sure Storybook understands TS path aliases and shared module formats.
- [ ] [Set up preview providers](#set-up-preview-providers): Import shared styles and wrap stories with any necessary context providers.
- [ ] [Harmonize addon and feature config](#harmonize-addon-and-feature-config): Align `.storybook/main.ts` options with Turborepo guidance and workspace expectations.

### Define story globs

#### Summary

Scope Storybook to the two packages called out in the brief.

#### Description

- Edit `.storybook/main.ts` to set `stories` to `['../../vsc-webview/src/**/*.stories.@(ts|tsx)', '../../../subs/ds/pkgs/ui/src/**/*.stories.@(ts|tsx)']` (adjust paths relative to `pkgs/storybook/.storybook`).
- Delete any `stories` entries that point inside `pkgs/storybook` or other packages.
- Update the `docs: { autodocs: true }` configuration if required by the new Storybook version so MDX docs are output correctly.

### Enable workspace path resolution

#### Summary

Ensure Storybook can import via workspace aliases.

#### Description

- Add dev dependencies `vite-tsconfig-paths` and `@storybook/addon-essentials` (if not already installed) to `pkgs/storybook`.
- Update `.storybook/main.ts` to include a `viteFinal` hook that applies `viteTsconfigPaths()` and sets `resolve.alias` for any remaining manual aliases (e.g., `@wrkspc/*`).
- Confirm `tsconfig.json` in `pkgs/storybook` includes `extends` pointing at the repo base config and sets `compilerOptions.paths` if needed for Storybook-only aliases.

### Set up preview providers

#### Summary

Load global CSS and shared providers so components look correct.

#### Description

- Update `.storybook/preview.ts` (or `.storybook/preview.tsx` if JSX needed) to import `../vsc-webview/src/styles.css` and any other global styles noted in Step 1.
- Wrap the `decorators` export with required providers (e.g., `ThemeProvider`, `I18nProvider`) from workspace packages; if no provider exists yet, document a TODO comment referencing the source of truth.
- Configure global `parameters` for controls, actions, and backgrounds to match the design system defaults.

### Harmonize addon and feature config

#### Summary

Bring add-ons and experimental flags in line with the guide.

#### Description

- Verify `.storybook/main.ts` includes `addons` such as `@storybook/addon-essentials`, `@storybook/addon-interactions`, and `@storybook/addon-a11y` if desired; disable any unused defaults.
- Set `framework: { name: '@storybook/react-vite', options: {} }` and ensure the `docs` block reflects the Vite builder.
- Add or update `.storybook/preview-head.html` if fonts or meta tags are required by the UI package.
- Document final config choices in `agents/plans/001-storybook-integration/artifacts/config-notes.md` for future maintenance.

## Questions

None.

## Notes

- Keep the story globs narrowly scoped until the user approves expanding coverage beyond the two packages.
