# Extension Messaging Architecture

The VS Code extension now relies on the consolidated `@wrkspc/vsc-message` package as its single source of truth for webview message contracts. Each domain—auth, prompts, files, sync, and others—exposes a namespace-scoped union under the `VscMessage*` pattern, and the top-level `VscMessage` union composes those domains alongside the lower-level Yjs sync messages (`VscMessageSync`). Message type strings follow a kebab-case convention with domain prefixes, for example `prompt-run-start` or `auth-vercel-gateway-state`.

## VscMessageBus

`VscMessageBus` wraps a `vscode.Webview` instance to provide typed send/subscribe helpers. Controllers register listeners that automatically narrow payloads based on the message `type`, and outbound calls must supply a value assignable to `VscMessage`.

```ts
import type { VscMessage } from "@wrkspc/vsc-message";
import { VscMessageBus } from "@/aspects/message";

const bus = new VscMessageBus(webview, {
  debug: process.env.MINDRIG_DEBUG_MESSAGES === "true",
  logger: ({ direction, message }) => console.debug(direction, message),
});

const dispose = bus.on("auth-vercel-gateway-state", (message) => {
  console.log(message.payload.maskedKey);
});

const status = bus.on("auth-vercel-gateway-status", (message) => {
  console.log(message.payload.status, message.payload.message);
});

const outbound: VscMessage = { type: "models-data-get" };
await bus.send(outbound);

dispose.dispose();
status.dispose();
```

The provider keeps a single bus per webview, registers handlers for the active aspects (prompts, sync, attachments, and so on), and disposes it alongside the view. Debug logging can be toggled by setting `MINDRIG_DEBUG_MESSAGES=true` before activating the extension; the flag instructs the bus to warn about malformed payloads while also piping events through the optional `logger` callback for diagnostics or telemetry.

## Controller Integration and Tests

Controllers interact with the bus instead of calling `webview.postMessage` directly. For example, the workbench provider reacts to `settings-streaming-set` by persisting the preference and echoing a `settings-streaming-state` message, and it publishes prompt lifecycle events (`prompt-run-start`, `prompt-run-update`, `prompt-run-complete`, and related execution results) through the same facade. The new `ModelsDataController` also emits `models-data-response` with `{ gateway, dotDev }` payloads in addition to `auth-vercel-gateway-status` updates after each user-scoped fetch attempt. Unit tests exercise these flows via the `createWorkbenchHarness` helper, while `vscMessageBus.test.ts` covers subscription lifecycles, one-shot handlers, logging hooks, and invalid payload handling.

All new tests live beside the source (`src/aspects/message/vscMessageBus.test.ts`, `src/__tests__/*`), aligning with the updated Vitest include rules. Run `pnpm --filter vscode test/unit` to validate extension messaging.
