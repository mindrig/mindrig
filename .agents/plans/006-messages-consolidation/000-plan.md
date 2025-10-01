# VSC Message Consolidation

## Brief

Establish a single, typed messaging contract for the VS Code extension and webview by consolidating scattered message definitions, introducing domain-focused unions, and equipping both sides with typed send/subscribe APIs backed by comprehensive tests.

## Plan

- [ ] [Map Existing Messages](./001-map-existing-messages.md): Catalog every extension↔webview message, its payload shape, and runtime side effects to inform the unified schema.
- [ ] [Baseline Message Tests](./002-baseline-message-tests.md): Add regression tests and helpers that capture current message-driven behaviors in extension and webview before refactoring.
- [ ] [Refactor Vsc Sync Package](./003-refactor-vsc-sync.md): Rename and adjust `@wrkspc/vsc-sync` message exports to the new `VscMessageSync` convention without altering behavior.
- [ ] [Introduce Vsc Message Package](./004-introduce-vsc-message.md): Create `@wrkspc/vsc-message` with domain modules that union `VscMessageSync` and higher-level messages into a single `VscMessage` type.
- [ ] [Extension Message Infrastructure](./005-extension-message-infrastructure.md): Implement typed message aspects/controllers in the extension that send and subscribe using the consolidated `VscMessage` API.
- [ ] [Webview Refactor](./006-webview-refactor.md): Replace webview messaging hacks with a `useMessage` hook and typed helpers while updating components and tests.

## Steps

### [Map Existing Messages](./001-map-existing-messages.md)

Survey both codebases (`pkgs/vsc-extension`, `pkgs/vsc-webview`, related packages) to inventory all `postMessage` and message handling sites, recording direction, payload, and dependencies. Group messages by domain (sync, file, prompts, settings, auth, etc.), note any inconsistent naming, and identify shared payload structures that may belong in `@wrkspc/vsc-types`. Produce a canonical list and target naming scheme (kebab-case prefixes) that will guide later steps.

### [Baseline Message Tests](./002-baseline-message-tests.md)

Design test helpers that simulate VS Code messaging for both extension and webview. Add regression tests covering current side effects (e.g., document sync, prompt execution, settings updates, secrets management) without changing implementation yet. Ensure tests assert on message type strings, payload shapes, and resulting state changes so refactors can be validated.

### [Refactor Vsc Sync Package](./003-refactor-vsc-sync.md)

Update `pkgs/vsc-sync` to rename `SyncMessage` namespace/types to `VscMessageSync`, adjust exports/imports, enforce kebab-case `type` values, and document usage. Confirm existing sync logic and upcoming tests rely on the updated names without altering payload semantics or Yjs integration.

### [Introduce Vsc Message Package](./004-introduce-vsc-message.md)

Create `pkgs/vsc-message` with domain-specific modules (e.g., `VscMessageFile`, `VscMessagePrompts`) that define typed message variants plus matching namespaces. Compose these into a root `VscMessage` union that also includes `VscMessageSync`. Extract any cross-package payload types into `@wrkspc/vsc-types` only when necessary. Provide clear entry points for consuming packages.

### [Extension Message Infrastructure](./005-extension-message-infrastructure.md)

Implement a message aspect within `pkgs/vsc-extension` that centralizes sending/receiving of `VscMessage` variants, splitting responsibilities into controllers similar to `VscSettingsController`. Update command handlers and services to use the typed API and ensure existing and new tests cover extension-side message flows.

### [Webview Refactor](./006-webview-refactor.md)

Introduce a `useMessage` hook and related utilities in `pkgs/vsc-webview` that consume `VscMessage`. Refactor components to subscribe and dispatch through the new hook, remove custom hacks, and align tests with the new helpers while keeping baseline side effects intact.

## Questions

### Priority Message Domains

Which message domains (e.g., prompts, files, auth, outputs) are highest priority to stabilize first if sequencing is required?

#### Answer

Follow existing aspects and folder boundaries when grouping messages; there is no predefined prioritization by domain, and we can revisit the structure after consolidation if needed.

### Non-Extension/Webview Consumers

Do any other packages or processes currently consume these messages (e.g., CLI, testing harnesses) that need to remain compatible with the consolidated types?

#### Answer

Only the extension and webview exchange these messages today, aside from definitions already in `@wrkspc/vsc-sync`; no other consumers require backward compatibility.

## Notes

- Previously disabled CRDT sync tests regressed when `useVsc` context was introduced; revive and stabilize them even though the current UI hides the editor.
- Message `type` strings must adopt consistent kebab-case prefixes (`sync-*`, `file-*`, etc.); the plan assumes we may rename existing types accordingly and update all call sites.
- Tests added in Step 2 should run in CI and local workflows before any large-scale refactor commits.
- Consider documenting the final message schema in package READMEs once refactoring is complete.

## Prompt

Read AGENTS.md and follow job instructions .agents/jobs/plan-generation.md

I want you to plan messages consolidation refactoring.

Right now we have messages that we use to communicate between the extension and the webview scattered. There's no single typed source of truth of what kind of messages are available and what are the payloads. I want you to fix that.

I want to have two pages to address that:

- pkgs/vsc-sync (`@wrkspc/vsc-sync`): Currently present but unfinished. It should hold message interfaces and that we need to sync via CRDT (using yjs). The messages should stay largely the same. Use pkgs/vsc-sync/src/message.ts to see what kind of types structure I expect. The only thing I want to do is to refactor naming: 1) it should prefix with Vsc and have Message in front: `SyncMessage` -> `VscMessageSync`
- pkgs/vsc-message (`@wrkspc/vsc-message`): Higher level messages, should include everything else we have, it should also depend on @wrkspc/vsc-sync and union with `VscMessageSync` to form single union `VscMessage`. You can group messages into modules, e.g. `VscMessageFile`, `VscMessagePrompts`, etc. Use a similar structure like `VscMessageSync` with a union and a namespace with the same name on the root level.

Message `type` format must be consistent in kebab-case, starting with a prefix e.g. `sync-*`, `file-*`, etc.

If needed, use pkgs/vsc-types (`@wrkspc/vsc-types`) as a `@wrkspc/vsc-message` dependency to store types that should be shared with other packages e.g. `@wrkspc/vsc-settings`. There's no need to extract everything to shared types, i.e. payload interfaces should be in `@wrkspc/vsc-message`.

In pkgs/vsc-extension and pkgs/vsc-webview define `message` aspects that would expose functions and hooks to subscribe to and send these messages, so the exposed APIs are all typed.

Right now webview components have hacks that allow them to subscribe to messages from a parent component. There's no need for that, allow components to subscribe using a hook `useMessage` (look at `useSettings` for an example of how to structure and use such a hook).

Before proceeding to refactor webview components to use the new messages model, make sure you write tests for existing message side effects first, make them pass and only then refactor simultaneously changing tests. Make sure to introduce test helpers to simplify message handling in tests. The same goes for extension, use a similar approach with test coverage, so we can make sure we didn't break anything along the way.

When needed organize extension functionality into components similar to `VscSettingsController` in pkgs/vsc-settings/src/controller.ts.

There's absolutely no need for backward compatibility, as the application is still in development.
