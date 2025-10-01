# Map existing messages

## Spec

Inventory every extension ↔ webview message, its payload, and runtime side effects so later steps can confidently rename and consolidate around a single typed contract. Capture both directions—extension→webview and webview→extension—so reply handlers and initiators remain in sync.

## Tasks

- [ ] [Capture extension message producers](#capture-extension-message-producers): Document all places the extension posts messages to the webview and the payload shapes they emit.
- [ ] [Capture webview message producers](#capture-webview-message-producers): Document all places the webview posts messages back to the extension and the payload shapes they emit.
- [ ] [Audit webview message subscriptions](#audit-webview-message-subscriptions): List every `window.addEventListener`/`useVsc` subscription and note expected payload requirements.
- [ ] [Audit extension message subscriptions](#audit-extension-message-subscriptions): Enumerate every `onDidReceiveMessage`/`subscribe` handler the extension uses to consume webview messages and the associated contracts.
- [ ] [Survey shared type definitions](#survey-shared-type-definitions): Record message-related types already exposed from `@wrkspc/vsc-sync`, `@wrkspc/vsc-types`, or ad-hoc modules.
- [ ] [Correlate message pairs and domains](#correlate-message-pairs-and-domains): Cross-reference senders with receivers, tagging their direction, domain, and any side effects or dependencies.
- [ ] [Publish canonical inventory artifact](#publish-canonical-inventory-artifact): Summarize the finalized matrix and open questions for downstream refactors.

### Capture extension message producers

#### Summary

Locate every extension-side `postMessage` invocation and classify the payload contracts.

#### Description

- Use `rg "postMessage" pkgs/vsc-extension -n` to list all message sends from the extension provider, aspects, and services.
- For each call, record the source file, function, message `type`, payload shape, and triggering action in `.agents/plans/006-messages-consolidation/artifacts/messages-inventory.md` under an "Extension → Webview" table.
- Note whether payload interfaces already exist or if the shapes are inferred from inline literals.

### Capture webview message producers

#### Summary

Locate every webview-side `postMessage` invocation and classify the payload contracts headed toward the extension.

#### Description

- Search for `vscode.postMessage`, `useVsc().postMessage`, or helper wrappers in `pkgs/vsc-webview` to list all message sends back to the extension.
- For each call, log the source component/module, triggering interaction, message `type`, and payload schema in the inventory artifact under a "Webview → Extension" table.
- Note whether messages expect acknowledgments or responses so follow-up work can map request/response flows.

### Audit webview message subscriptions

#### Summary

Document how the webview listens for extension messages and what contract each handler expects.

#### Description

- Search for `window.addEventListener("message"` and `useVsc().subscribe` usages within `pkgs/vsc-webview` to capture every handler.
- Log each handler into the inventory artifact with expected message `type`, TypeScript guards, derived state updates, and any side effects (state mutations, notifications, etc.).
- Highlight handlers that rely on loosely typed casts or optional chaining so later work can tighten them with the new API.

### Audit extension message subscriptions

#### Summary

Document how the extension listens for webview messages and the contract each handler expects.

#### Description

- Inspect `webviewPanel.webview.onDidReceiveMessage`, `context.subscriptions.push`, and helper abstractions within `pkgs/vsc-extension` to capture every handler that consumes messages from the webview.
- Track each handler in the inventory artifact with expected message `type`, validation or guard logic, branching behavior, and side effects (FS operations, telemetry, sync updates, etc.).
- Flag handlers that assume implicit payload structures or rely on `any` so the consolidation work can introduce stronger types.

### Survey shared type definitions

#### Summary

Identify existing message-related types that may migrate into the unified packages.

#### Description

- Inspect `pkgs/vsc-sync/src/message.ts`, `pkgs/vsc-sync/src/*`, and any message enums/types in `pkgs/vsc-types` to catalog reusable definitions.
- Capture whether the types are exported, internal, or duplicated across packages, noting naming conventions (e.g., `SyncMessage` vs. `MessageSync`).
- Flag overlaps or conflicts (same payload, different casing) in the artifact for decision during consolidation.

### Correlate message pairs and domains

#### Summary

Match senders with receivers and group them into domain-focused categories.

#### Description

- Merge the extension and webview tables into a single matrix that lists `type`, direction (extension→webview, webview→extension, bidirectional), source module, and destination handler.
- Assign each message to a domain (sync, prompts, files, settings, auth, telemetry, etc.) and indicate if the message is request/response or fire-and-forget.
- Note dependencies such as `yjs`, workspace storage, or feature flags that future refactors must preserve.

### Publish canonical inventory artifact

#### Summary

Finalize the inventory document that later steps will rely on for renaming and consolidation decisions.

#### Description

- Normalize the artifact into sections for Extension→Webview, Webview→Extension, and Shared/Utility messages, including payload interfaces and outstanding questions.
- Store supplementary JSON/YAML snapshots (if helpful) under `.agents/plans/006-messages-consolidation/artifacts/` (e.g., `messages-inventory.json`) for machine reference.
- Review the inventory with stakeholders (via plan updates) and annotate any TBD items that require clarification before refactors begin.

## Questions

None.

## Notes

- Keep artifacts in `.agents/plans/006-messages-consolidation/artifacts/` so downstream steps can reuse structured data.
