# Webview Messaging Migration Plan

## Goals

- Replace ad-hoc `window.addEventListener` handlers and direct `vsc.postMessage` calls with a typed `useMessage` API backed by `@wrkspc/vsc-message` unions.
- Align every outbound/inbound message with the kebab-case schema adopted by the extension (`prompt-run-*`, `settings-*`, `auth-*`, etc.).
- Preserve existing UX (prompt runs, streaming feedback, code sync, settings persistence, models.dev lookup) while incrementally refactoring to the new infrastructure.

## Current Structure Overview

| Area | Files | Message Usage |
| --- | --- | --- |
| Bootstrapping | `app/Index.tsx` | Dispatches `webviewReady`, `setVercelGatewayKey`, `clearVercelGatewayKey`, listens for all messages and fans out into contexts. |
| Global VSC bridge | `hooks/useVsc.tsx`, `testUtils/messages.tsx` | Exposes raw `vscode` API and a `postMessage` passthrough. |
| Code sync | `hooks/useCodeSync.ts`, `aspects/dev/CodeEditor.tsx` | Uses `sync-*` types already in kebab-case but runs through bespoke hook and direct postMessage. |
| Settings | `aspects/settings/Context.tsx`, `aspects/assessment/Assessment.tsx` | Listens for `streamingPreference`, sends `getStreamingPreference` / `setStreamingPreference`. |
| Prompts & assessment | `aspects/assessment/Assessment.tsx`, `aspects/assessment/PromptPanel/*` | Heavy inbound (`promptRunStarted`, etc.) and outbound (`executePrompt`, `stopPromptRun`, `requestAttachmentPick`, `requestCsvPick`). |
| Models.dev | `aspects/models-dev/Context.tsx` | Sends `getModelsDev`, listens for `modelsDevResponse`. |
| Legacy message tests | `__tests__/*.test.tsx`, `aspects/dev/CodeEditor.test.tsx` | Assert against legacy message names. |

## Target Message Mapping

| Legacy | New | Producer(s) | Consumer(s) |
| --- | --- | --- | --- |
| `webviewReady` | `lifecycle-webview-ready` | `app/Index.tsx` | Extension | 
| `setVercelGatewayKey` | `auth-vercel-gateway-set` | `app/Index.tsx` | Extension |
| `clearVercelGatewayKey` | `auth-vercel-gateway-clear` | `app/Index.tsx` | Extension |
| `getStreamingPreference` | `settings-streaming-get` | `Assessment` | Extension |
| `streamingPreference` | `settings-streaming-state` | Extension | `Assessment` |
| `setStreamingPreference` | `settings-streaming-set` | `Assessment` | Extension |
| `promptRun*` camelCase | `prompt-run-*` | Extension/Webview | `Assessment` |
| `stopPromptRun` | `prompt-run-stop` | `Assessment` | Extension |
| `executePrompt` | `prompt-run-execute` | `Assessment` | Extension |
| `requestAttachmentPick` | `attachments-request` | `Assessment` | Extension |
| `requestCsvPick` | `dataset-csv-request` | `Assessment` | Extension |
| `getModelsDev` | `models-dev-get` | `models-dev/Context` | Extension |
| `modelsDevResponse` | `models-dev-response` | Extension | `models-dev/Context` |
| `activeFileChanged` | `file-active-change` | Extension | `prompt pinning`, `Assessment` |
| `promptsChanged` | `prompts-change` | Extension | `prompt pinning`, `Assessment` |
| `revealPrompt` | `prompts-reveal` | Webview | Extension |

`sync-*` messages already comply but will be routed via the new hook to drop custom listener plumbing.

## Migration Order

1. **Infrastructure Foundation**
   - Create `pkgs/vsc-webview/src/aspects/message/` with a `VscMessageProvider` and `useMessage` hook that mirrors the extension bus API (typed `send`, `on`, `once`).
   - Update `app/Index.tsx` to instantiate the provider, emit `lifecycle-webview-ready`, and expose typed helpers through context instead of raw `window.addEventListener`.
   - Extend `hooks/useVsc.tsx` and testing utilities to supply the message provider for components/tests.

2. **Low-Risk Consumers**
   - Migrate `hooks/useCodeSync.ts` and `aspects/dev/CodeEditor.tsx` to subscribe via `useMessage` while keeping the existing `sync-*` payloads.
   - Update related tests (`hooks/useCodeSync.test.tsx`, `aspects/dev/CodeEditor.test.tsx`, `integration/sync-flow.test.tsx`).

3. **Settings & Models Contexts**
   - Refactor `aspects/settings/Context.tsx` and `aspects/models-dev/Context.tsx` to new message names (`settings-*`, `models-dev-*`).
   - Keep a thin adapter for local state until all callers are updated.

4. **Assessment / Prompt Domains**
   - Introduce typed helpers for prompt lifecycle events and attachments within `aspects/assessment/Assessment.tsx`.
   - Swap outbound calls to the kebab-case variants and update inbound handlers (`prompt-run-*`, `attachments-load`, `dataset-csv-load`).
   - Adjust associated tests (`__tests__/streaming-assessment.test.tsx`, `__tests__/prompt-pinning.test.tsx`).

5. **Cleanup & Legacy Removal**
   - Remove obsolete message constants, inline switch statements that depend on camelCase names, and any proxy contexts made redundant by `useMessage`.
   - Ensure documentation/tests reflect the new API (`docs/architecture/messages.md` may gain a webview section).

## Testing Strategy

- Reuse existing Vitest suites; rewrite expectations to kebab-case messages as each domain migrates.
- Add focused tests for the new `useMessage` hook to guard typed subscriptions and disposal.
- Run `pnpm --filter @wrkspc/vsc-webview test/unit` after each migration slice; execute targeted suites (e.g., `streaming-assessment`) when modifying prompt logic.

## Risks & Mitigations

- **Dual message names during rollout**: perform migrations domain-by-domain but keep conversions atomic per PR/commit to avoid mismatches with the already updated extension.
- **Tight coupling in `Assessment.tsx`**: introduce helper utilities when switching to typed payloads to avoid regressions in complex nested handlers.
- **State initialization timing**: ensure `lifecycle-webview-ready` still fires after the provider mounts so the extension continues seeding initial state.
