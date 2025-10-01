# Extension message infrastructure

## Spec

Adopt the consolidated message unions inside the VS Code extension by introducing typed send/subscribe APIs, migrating existing controllers, and covering the new infrastructure with tests.

## Tasks

- [ ] [Design extension messaging aspect](#design-extension-messaging-aspect): Plan how controllers interact with the new typed bus.
- [ ] [Implement typed message bus wrapper](#implement-typed-message-bus-wrapper): Build utilities for sending and subscribing to `VscMessage` unions.
- [ ] [Migrate existing controllers](#migrate-existing-controllers): Update extension features to rely on the new infrastructure.
- [ ] [Backfill tests and diagnostics](#backfill-tests-and-diagnostics): Ensure messaging flows are validated and observable.
- [ ] [Document extension adoption](#document-extension-adoption): Share migration guidance for future contributors.

### Design extension messaging aspect

#### Summary

Define responsibilities and boundaries for the extension-side message infrastructure.

#### Description

- Draft an architecture note in `.agents/plans/006-messages-consolidation/artifacts/extension-messaging.md` describing the aspect/controller structure (e.g., `MessageAspect`, `MessageController`).
- Decide whether to keep messaging in an existing aspect (e.g., `WorkbenchViewProvider`) or create a dedicated module under `pkgs/vsc-extension/src/aspects/messages`.
- Identify lifecycle hooks (activation, webview ready, dispose) and dependency injection patterns for controllers.

### Implement typed message bus wrapper

#### Summary

Create utilities that enforce `VscMessage` types for outbound/inbound traffic.

#### Description

- Add a module (e.g., `pkgs/vsc-extension/src/lib/vscMessageBus.ts`) that wraps the webview panel’s `postMessage` and `onDidReceiveMessage` with generic typing.
- Provide helper functions like `sendMessage(message: VscMessage)` and `onMessage<K extends VscMessage['type']>(type, handler)` to scope listeners.
- Include runtime validation (optional) to guard against malformed payloads, logging warnings when messages fail schema checks.

### Migrate existing controllers

#### Summary

Update extension features to consume the new typed messaging utilities.

#### Description

- Refactor controllers (settings, prompts, sync, auth, etc.) to import the new bus helper and replace manual `postMessage` calls or event wiring.
- Remove redundant message-specific utilities replaced by the shared infrastructure.
- Ensure new types from `@wrkspc/vsc-message` are used consistently, updating imports and generics.

### Backfill tests and diagnostics

#### Summary

Verify the new infrastructure works and remains observable.

#### Description

- Extend Step 2 tests or add new ones to cover the typed bus, ensuring handlers receive narrowed payloads and that unsubscribing cleans up listeners.
- Add diagnostic logging hooks (if desirable) to trace message flow during development, ensuring they are gated behind a debug flag.
- Validate error handling by simulating invalid payloads and confirming the extension responds gracefully.

### Document extension adoption

#### Summary

Explain how to use the typed messaging infrastructure going forward.

#### Description

- Update `docs/architecture/messages.md` or create a new document in `docs/architecture/` describing the extension messaging architecture.
- Provide code snippets demonstrating typical send/receive patterns, including controller integration.
- Mention migration steps for future controllers, referencing the `@wrkspc/vsc-message` unions and helper APIs.

## Questions

None.

## Notes

- Coordinate with Step 6 to ensure the webview expects the same helper semantics before flipping any feature flags.
