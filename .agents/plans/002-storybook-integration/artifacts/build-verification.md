# Storybook build verification (2025-09-22)

- Ran `pnpm --filter @wrkspc/storybook build` at 08:07 UTC-0; build succeeded after surfacing Vite warnings about ignoring `'use client'` directives in UI packages. No blocking errors observed.
- Confirmed `pkgs/storybook/dist/` contains manager assets, fonts, `index.html`, and `iframe.html`; no scaffolded example stories remain.
- Served the static bundle via `pnpm dlx serve pkgs/storybook/dist --listen 4400` and fetched `/?path=/story/ui-button--primary` plus `index.json` to verify the `UI/Button` and `Webview/File Label` entries were registered without runtime errors.
- Recommendation: future work could silence the `'use client'` warnings by excluding non-story modules or pre-compiling the React Aria surfaces, but no follow-up is required before merging.
