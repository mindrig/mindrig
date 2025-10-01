# Webview refactor

## Spec

Adopt the consolidated messaging model in the webview by introducing a typed `useMessage` hook, migrating components to the new helpers, and removing ad-hoc subscription hacks while keeping UI behavior intact.

## Tasks

- [ ] [Plan component migration order](#plan-component-migration-order): Sequence updates to avoid breaking critical flows.
- [ ] [Implement useMessage hook](#implement-usemessage-hook): Build the typed hook that wraps the VS Code API bridge.
- [ ] [Refactor inbound message handling](#refactor-inbound-message-handling): Update state management and listeners to use the new hook and unions.
- [ ] [Refactor outbound messaging](#refactor-outbound-messaging): Replace manual `postMessage` calls with typed helpers across components.
- [ ] [Clean up legacy hacks and tests](#clean-up-legacy-hacks-and-tests): Remove obsolete code paths and refresh automated coverage.

### Plan component migration order

#### Summary

Chart a safe rollout path for updating webview components to the new messaging infrastructure.

#### Description

- Review the inventory artifact and identify components relying heavily on messaging (e.g., CRDT editors, prompt panels, settings views).
- Document the migration sequence in `.agents/plans/006-messages-consolidation/artifacts/webview-migration.md`, grouping related components so behavior remains coherent.
- Call out dependencies on extension-side changes (Step 5) and decide on feature flags or branch strategy if staged rollout is needed.

### Implement useMessage hook

#### Summary

Provide a typed hook that encapsulates subscribe/send logic for `VscMessage` unions.

#### Description

- Create `pkgs/vsc-webview/src/hooks/useMessage.ts` (or under `aspects/messages`) that exposes `subscribe`, `once`, and `send` functions with generic type parameters.
- Leverage `@wrkspc/vsc-message` types to narrow handlers and enforce payload shapes; optionally include runtime validation for development builds.
- Update the existing `useVsc` context to include the new hook or delegate to it.

### Refactor inbound message handling

#### Summary

Migrate state stores and effects to consume messages through the typed hook.

#### Description

- Replace direct `window.addEventListener` usage with `useMessage` subscriptions in central state modules (CRDT sync, prompt results, settings, telemetry).
- Ensure each subscription handles cleanup correctly and updates state slices using typed payloads.
- Remove redundant manual parsing or `any` casts replaced by the typed hook.

### Refactor outbound messaging

#### Summary

Ensure components send messages through typed helpers for consistency and safety.

#### Description

- Update components and services that call `vscode.postMessage` (e.g., prompt execution triggers, file actions, settings updates) to use a `sendMessage` helper from the hook/context.
- Provide helper factories for common outbound messages so components pass domain-specific data without duplicating `type` strings.
- Confirm event handlers still debounce/throttle or handle optimistic UI updates as before.

### Clean up legacy hacks and tests

#### Summary

Remove no-longer-needed workarounds and align tests with the new messaging layer.

#### Description

- Delete legacy subscription hacks and context plumbing that previously proxied messages between components.
- Update Vitest suites to leverage the new hook utilities, adjusting mocks to assert on typed payloads.
- Ensure Storybook or other environments integrate the hook correctly, adding documentation snippets if necessary.

## Questions

None.

## Notes

- Coordinate with Step 5 changes to avoid drift between extension and webview message expectations during rollout.
