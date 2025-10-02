# Extension Messaging Aspect Design

## Goals

- Centralise all webview message send/receive logic behind a typed façade.
- Expose ergonomic helpers for controllers/services to publish or subscribe to `VscMessage` variants without touching raw VS Code APIs.
- Provide light-weight diagnostics (debug logging + guard fallback) to surface malformed messages during development.

## Proposed Structure

```
pkgs/vsc-extension/src/aspects/message/
  VscMessageBus.ts      // Core wrapper around postMessage/onDidReceiveMessage
  VscMessageRouter.ts   // Helper to route incoming messages by domain/type
  index.ts              // Aspect entry (register/dispose)
```

- `VscMessageBus` encapsulates the webview handle and exposes:
  - `send(message: VscMessage): Thenable<boolean>` – typed outbound send.
  - `on<K extends VscMessage["type"]>(type: K, handler: (message: Extract<VscMessage, { type: K }>) => void): vscode.Disposable` – strongly typed subscription.
  - `once(...)` convenience helper for single-shot handlers.
  - `broadcast(message: VscMessage)` alias for compatibility (optional).
- `VscMessageRouter` maintains a map of type → listeners, handles guard checks (`isVscMessage`) before invoking handlers, and logs invalid payloads when `process.env.MINDRIG_DEBUG_MESSAGES === "true"`.
- Aspect initialises inside `WorkbenchViewProvider.resolveWebviewView`, stores the bus instance, and exposes it to controllers through dependency injection (existing `register` pattern).

## Integration Plan

1. Instantiate `VscMessageBus` after webview resolves, passing the `vscode.Webview` reference.
2. Replace direct `onDidReceiveMessage` usage in `WorkbenchViewProvider` with router registration calls.
3. Provide helper exports (e.g., `createMessageAspect`) that feed the bus into higher-level controllers (settings, auth, sync, prompt run) so each controller registers its listeners in one place.
4. Gradually migrate controllers to import `@wrkspc/vsc-message` domain unions and use `bus.send(...)` instead of manual `postMessage`.

## Diagnostics & Safety

- `VscMessageBus` logs a warning when an incoming message fails the `isVscMessage` guard, optionally including the raw payload when debug flag enabled.
- Provide disposable subscriptions to ensure listeners unregister during extension deactivation.
- Expose a helper `withMessageDebugLogging(bus, logger)` for future telemetry hooks (optional).

## Testing Strategy

- Extend existing Vitest suites to instantiate a `VscMessageBus` with a mocked webview and assert:
  - `send` forwards the message with the exact object (matching type + payload).
  - Unknown message types are ignored with a warning.
  - Type-specific subscriptions receive correctly narrowed payloads.
- Reuse the harness from Step 2 (`createWorkbenchHarness`) to validate integration with the real `WorkbenchViewProvider`.
