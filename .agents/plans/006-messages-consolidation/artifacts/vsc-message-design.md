# VSC Message Package Design

## Export Goals

- `VscMessage` — top-level discriminated union covering all extension ↔ webview messages.
- Domain unions/namespaces grouped by feature area:
  - `VscMessageFile` (file/fs events: `active-file-changed`, `file-content-changed`, `file-saved`, `cursor-position-changed`).
  - `VscMessagePrompts` (prompt inventory / command bridging: `prompts-changed`, `execute-prompt-from-command`, `reveal-prompt`).
  - `VscMessagePromptRun` (execution lifecycle: `execute-prompt`, `prompt-run-started`, `prompt-run-update`, `prompt-run-result-completed`, `prompt-run-completed`, `prompt-run-error`, `prompt-execution-result`, `stop-prompt-run`).
  - `VscMessageSettings` (settings + streaming preference: `settings-updated`, `get-streaming-preference`, `set-streaming-preference`, `streaming-preference`).
  - `VscMessageAuth` (Vercel gateway flows: `get-vercel-gateway-key`, `set-vercel-gateway-key`, `clear-vercel-gateway-key`, `vercel-gateway-key-changed`, `open-vercel-gateway-panel`).
  - `VscMessageAttachments` (attachment pickers: `request-attachment-pick`, `attachments-loaded`).
  - `VscMessageDataset` (CSV import: `request-csv-pick`, `csv-file-loaded`).
  - `VscMessageModels` (models.dev fetch: `get-models-dev`, `models-dev`).
  - `VscMessageLifecycle` (`webview-ready`).
- Re-export `VscMessageSync` from `@wrkspc/vsc-sync` and compose into master union.
- Provide type guards:
  - `isVscMessage` (narrow unknown to union by checking `type` string).
  - Domain-specific guards (e.g., `isVscMessagePromptRun`, `isVscMessageSettings`).
- Optional factory helpers (e.g., `createPromptRunStarted`, `createSettingsUpdated`) to standardize payload construction.

## Naming & Structure

- Package root `src/index.ts` exports:
  - `VscMessage`
  - All domain unions (+ namespaces with message interfaces)
  - `guards` module exposing runtime guards/factories.
- Directory layout:
  - `src/domains/file/messages.ts`, `src/domains/prompts/messages.ts`, etc.
  - `src/guards.ts` with reusable guard helpers.
  - `src/factories.ts` (optional) if builders become verbose; start with guards only.
- Domain modules follow namespace pattern (e.g., `export type VscMessageFile = ...` with `export namespace VscMessageFile { interface ActiveFileChanged ... }`).
- Message `type` strings adopt kebab-case prefixes derived from inventory (e.g., `file-content-changed`, `prompt-run-started`). Align naming with Step 1 inventory; convert camelCase legacy types (e.g., `activeFileChanged` → `file-content-changed`).

## Dependencies

- Depends on `@wrkspc/vsc-sync` for `VscMessageSync` and shared `SyncFile` types.
- Pull payload interfaces from existing packages when available (`@wrkspc/vsc-types` for prompt run payloads, etc.).
- No runtime dependencies beyond TypeScript helpers; published as type-only + small runtime guards.

## Adoption Plan

- Extension/webview will replace ad-hoc string literals with imports from `@wrkspc/vsc-message`.
- Provide backward-compatible string constants (e.g., `VscMessagePromptRun.Type.ExecutePrompt = "prompt-run:execute"`) to ease migration.
- Document usage with quick examples in package README and plan artifacts.
