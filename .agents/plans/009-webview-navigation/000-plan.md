# Webview Hash Navigation

## Brief

Design the approach for adopting React Router's `HashRouter` in the VS Code webview, ensuring the index experience remains primary, compatibility across both `index.html` (VS Code webview) and `/` (Vite dev server) entrypoints, an auth view renders within the shared layout with a FileHeader-style toolbar, user workspace state persists across route changes via local storage, and automated tests cover navigation and persistence.

## Steps

- [x] [Assess Current Webview State](.agents/plans/009-webview-navigation/001-audit-webview-state.md): Inventory existing views, stateful components, and current persistence touchpoints.
- [x] [Adopt React Router Hash Navigation](.agents/plans/009-webview-navigation/002-hash-navigation.md): Integrate React Router's `HashRouter` to drive index and auth routes while providing navigation helpers for shared components.
- [x] [Integrate Auth Page in Layout](.agents/plans/009-webview-navigation/003-auth-page-layout.md): Compose the auth view inside `<Layout>` with a FileHeader-inspired header that returns via history and falls back to the index when needed.
- [x] [Ensure State Persistence Coverage](.agents/plans/009-webview-navigation/004-state-persistence.md): Define and implement comprehensive local storage saving and hydration for prompt playground state.
- [x] [Add Navigation and Persistence Tests](.agents/plans/009-webview-navigation/005-testing.md): Specify React Testing Library coverage validating route rendering and state durability.

### [Assess Current Webview State](.agents/plans/009-webview-navigation/001-audit-webview-state.md)

Review `App.tsx`, state management hooks, and existing persistence code to catalogue which forms, selections, and data sources must survive navigation; note any gaps and integration constraints.

#### Status

BrowserRouter currently wraps the app to map `/` and `/index.html` to `<Index />`, with `Context` providers layered above; `Index` holds prompt, gateway, and CSV state while persistence relies on VS Code webview state for pinned prompts and `assessment/persistence.ts` localStorage helpers for playground data.

### [Adopt React Router Hash Navigation](.agents/plans/009-webview-navigation/002-hash-navigation.md)

Outline how to integrate `HashRouter` and `Routes`, normalize default and unknown hashes, and ensure the app renders the correct view across both the `index.html` webview entry and the `/` dev server entry.

#### Status

HashRouter now wraps the app with typed route metadata (`routes.ts`), index aliases preserve `/index.html` compatibility, and `useAppNavigation` exposes typed helpers (`navigateTo`, `goBackOrIndex`) for components needing programmatic routing.

### [Integrate Auth Page in Layout](.agents/plans/009-webview-navigation/003-auth-page-layout.md)

Plan the composition of the auth screen inside `<Layout>`, describe the FileHeader-style top bar, and determine how closing the auth view uses React Router navigation helpers to return users to the prior route without losing state.

#### Status

Auth route now renders `AuthVercel` inside `<Layout>` with a `PanelSection` toolbar and history-aware close button, while the index and message handlers navigate to `#/auth` instead of toggling inline panels.

### [Ensure State Persistence Coverage](.agents/plans/009-webview-navigation/004-state-persistence.md)

Detail which pieces of prompt playground state need to be serialized, choose storage keys and update triggers, and establish hydration order to avoid flicker or stale data.

#### Status

Playground persistence now serializes collapse/expansion/view state, streaming toggles, and embeds a schema version; hydration rehydrates those maps and defaults gracefully when legacy snapshots are missing fields.

### [Add Navigation and Persistence Tests](.agents/plans/009-webview-navigation/005-testing.md)

Define the test scenarios and fixtures for React Testing Library, covering routing transitions (including initial loads at `/` and `/index.html`), persistence saves, and restores.

#### Status

New RTL suites cover HashRouter defaults/aliases (`hash-router-navigation.test.tsx`), the dedicated auth route flow with navigation mocks, and persistence versioning/field coverage via updated assessment integration plus a focused `persistence.test.ts`.

## Questions

### Auth Header Navigation Behavior

When the user clicks the FileHeader-style control on the auth page, should we always navigate back to `#index`, or mirror existing "Show Profile" / "Log In" flows?

#### Answer

Navigate back in history so the user returns to whichever route they visited before opening auth; fall back to `#index` only if no prior entry exists.

### Local Storage Scope and Retention

Are there limits on how long we should keep the prompt playground state in local storage, or scenarios where we should clear it (e.g., explicit logout)?

#### Answer

Keep the prompt playground state in local storage indefinitely with no automatic clearing, even across logouts, unless we implement an explicit reset later.

## Notes

Consider how the hash navigation interacts with any VS Code message passing or commands so we avoid regressions in extension-host communication.

## Prompt

Plan webview navigation.

Currently we don't have any routes besides index (defined in /wrkspc/mindrig/pkgs/vsc-webview/src/app/App.tsx).

I want to add hash-based (i.e., `#auth`) navigation. For now it should be just two pages: the default `#index` (or no hash at all) and the `#auth` page to render the agent token form/state (that we currently show on "Show Profile"/"Log In").

The `#auth` page should render inside `<Layout>` (currently dummy) and have a FileHeader-style (pkgs/vsc-webview/src/aspects/file/Header.tsx) top bar that allows the user to go back/close the page.

An important caveat is that the state of all the forms (selected data source, manual variables), selected CSV row, etc., must be preserved. I think there's no need to implement non-index pages as modals but rather ensure the prompt playground state is saved to local storage on every change. It will help when a user accidentally clicks away from a prompt. We have some state preservation, but I want to make sure it is comprehensive.

Make sure to add React Testing Library-based tests to prompt state saving as well as navigation.

## Follow-Ups

### Gateway Key Validation UX

Tighten the Vercel Gateway key workflow so the auth form stays open while a key is being validated, errors surface inline and on the index banner, and clearing the key falls back to global models without triggering user-scoped lookups or error spam.

#### Follow-Up Tasks

- [x] Keep the auth form open until the key verification completes and render inline errors when validation fails.
- [x] Ensure the index route shows the appropriate warning/error banner after invalid keys, including on reloads when the auth page starts in an error state.
- [x] Update the extension fallback logic so clearing the key skips user-scoped fetches, reuses cached global models when possible, and emits a non-error status when unauthenticated.
- [x] Extend integration/unit tests to cover invalid key submissions, index banner expectations, and the no-secret fallback path.

#### Prompt

1. It still turns form into masked key when I enter random string "123". It should wait until the key is verified by requesting the models and show an error below the input instead of collapsing if the key is invalid. Right now, I don't even see it making the request and failing. First figure out why it's a case (maybe you need to clear the user-scoped models cache, separate user-scoped and global-scoped caches, or maybe it doesn't try to fetch as there's global models data already present, I didn't really looked into the code), add test for it and only then fix it. As a result, an error is not produced and when I open the index, there's no error on top.

2. When I reload the extension with invalid key I don't see the error on top of index either. If that's a case, the auth page should display in error state below input rendering the error message.
