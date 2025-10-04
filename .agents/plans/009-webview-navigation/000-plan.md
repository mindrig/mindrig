# Webview Hash Navigation

## Brief

Design the approach for hash-based navigation in the VS Code webview, ensuring the index experience remains primary, an auth view renders within the shared layout with a FileHeader-style toolbar, user workspace state persists across route changes via local storage, and automated tests cover navigation and persistence.

## Steps

- [ ] [Assess Current Webview State](.agents/plans/009-webview-navigation/001-audit-webview-state.md): Inventory existing views, stateful components, and current persistence touchpoints.
- [ ] [Add Hash Navigation Framework](.agents/plans/009-webview-navigation/002-hash-navigation.md): Introduce routing utilities to react to hash changes, manage default routing, and expose navigation helpers.
- [ ] [Integrate Auth Page in Layout](.agents/plans/009-webview-navigation/003-auth-page-layout.md): Compose the auth view inside `<Layout>` with a FileHeader-inspired header that returns via history and falls back to the index when needed.
- [ ] [Ensure State Persistence Coverage](.agents/plans/009-webview-navigation/004-state-persistence.md): Define and implement comprehensive local storage saving and hydration for prompt playground state.
- [ ] [Add Navigation and Persistence Tests](.agents/plans/009-webview-navigation/005-testing.md): Specify React Testing Library coverage validating route rendering and state durability.

### [Assess Current Webview State](.agents/plans/009-webview-navigation/001-audit-webview-state.md)

Review `App.tsx`, state management hooks, and existing persistence code to catalogue which forms, selections, and data sources must survive navigation; note any gaps and integration constraints.

#### Status

TODO

### [Add Hash Navigation Framework](.agents/plans/009-webview-navigation/002-hash-navigation.md)

Outline how to listen to and programmatically update the URL hash, define route configuration, and ensure the app renders the correct view while keeping existing index behavior intact.

#### Status

TODO

### [Integrate Auth Page in Layout](.agents/plans/009-webview-navigation/003-auth-page-layout.md)

Plan the composition of the auth screen inside `<Layout>`, describe the FileHeader-style top bar, and determine how closing the auth view returns users to the index without losing state.

#### Status

TODO

### [Ensure State Persistence Coverage](.agents/plans/009-webview-navigation/004-state-persistence.md)

Detail which pieces of prompt playground state need to be serialized, choose storage keys and update triggers, and establish hydration order to avoid flicker or stale data.

#### Status

TODO

### [Add Navigation and Persistence Tests](.agents/plans/009-webview-navigation/005-testing.md)

Define the test scenarios and fixtures for React Testing Library, covering routing transitions, persistence saves, and restores.

#### Status

TODO

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

None.
