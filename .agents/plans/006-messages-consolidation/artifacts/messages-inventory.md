# Messages Inventory

## Extension -> Webview

<!-- prettier-ignore -->
| Type | Source | Trigger | Payload | Notes |
| --- | --- | --- | --- | --- |
| activeFileChanged | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:151 (#handleWebviewReady)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:495 (#initializeFileManager.onActiveFileChanged) | Webview reports ready or FileManager detects a new active editor file. | SyncFile.State with path, content, languageId, cursor info. | Primes webview state and kicks off prompt parsing + CRDT sync for supported files. |
| openVercelGatewayPanel | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:160 (#handleWebviewReady)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:427 (openVercelGatewayPanel) | Webview finishes loading with pending request or extension command invokes panel. | None. | Ensures the API key panel becomes visible/focused when requested before hydrate. |
| modelsDev | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:377 (#handleGetModelsDev)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:383 (#handleGetModelsDev catch) | Webview requests models.dev listing via getModelsDev. | { data: any } on success; { error: string } on failure. | Caches remote JSON; reused until extension reload to avoid redundant fetches. |
| promptsChanged | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:439 (#parseAndSendPrompts unsupported language)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:452 (#parseAndSendPrompts success)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:463 (#parseAndSendPrompts parser error)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:475 (#parseAndSendPrompts fallback catch) | Prompt parser runs for active file or when rehydrating cached prompts. | { prompts: Prompt[], parseStatus?: "success" or "error", parseError?: string }. | Webview uses to render prompt cards; error case retains cached prompts for resilience. |
| fileContentChanged | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:505 (#initializeFileManager.onFileContentChanged) | FileManager sees text changes in the tracked workspace file. | SyncFile.State mirroring current buffer contents. | Webview diffs content for prompt extraction and eventual CRDT sync decisions. |
| fileSaved | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:512 (#initializeFileManager.onFileSaved) | User saves an editor buffer that FileManager watches. | SyncFile.State snapshot at save time. | Allows webview to confirm durable persistence and refresh derived prompts. |
| cursorPositionChanged | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:518 (#initializeFileManager.onCursorPositionChanged) | Cursor or selection changes in the active editor. | SyncFile.State including selection offsets. | Keeps prompt preview selection in sync with VS Code caret. |
| csvFileLoaded | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:539 (#handleRequestCsvPick success)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:547 (#handleRequestCsvPick error) | User picks a CSV via requestCsvPick message. | { path: string, content: string } or { error: string }. | Feeds CSV preview/import flow inside the webview. |
| attachmentsLoaded | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:657 (#handleRequestAttachmentPick success)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:660 (#handleRequestAttachmentPick error) | Attachment picker completes in response to requestAttachmentPick. | { items: Array<{ path,name,mime,dataBase64 }> } or { error: string }. | Provides encoded files for prompt runs and maintains picker preference state. |
| settingsUpdated | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:693 (#registerSettings.onUpdate) | Settings aspect pushes new serialized settings. | VscSettingsController state object. | Hydrates webview settings store without direct VS Code API calls. |
| vercelGatewayKeyChanged | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:712 (#initializeSecretManager.onSecretChanged)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:728 (#sendVercelGatewayKey) | Secret storage value updates or webview requests current key. | { vercelGatewayKey: string | null }. | Keeps auth context aligned and drives login/logout UI state. |
| streamingPreference | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:750 (#handleGetStreamingPreference)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:762 (#handleSetStreamingPreference) | Webview fetches or sets global streaming preference. | { enabled: boolean }. | Backed by extension globalState; drives default prompt streaming behavior. |
| promptRunError | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:793 (#handleExecutePrompt.sendRunError) | Pre-flight failures, streaming errors, or cancellation notices during a run. | { runId: string, promptId: string, timestamp: number, error: string, resultId?: string }. | Webview surfaces toast/log updates; emitted alongside result-level completion events. |
| promptRunUpdate | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:805 (#handleExecutePrompt.sendRunUpdate) | Streaming delta arrives from AIService while run is active. | { runId: string, promptId: string, resultId: string, timestamp: number, delta: { type: "text", text: string } }. | Supports incremental rendering of AI output in the transcript. |
| promptExecutionResult | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:822 (#handleExecutePrompt missing secret)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:841 (#handleExecutePrompt missing API key)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1007 (#handleExecutePrompt cancelled run)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1243 (#handleExecutePrompt final success)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1261 (#handleExecutePrompt unexpected error) | Run finishes (success or failure) or aborts before executing. | { success: boolean, results: PromptRunResultData[], promptId: string, timestamp: number, runId: string, runSettings?: any, error?: string }. | Canonical summary message the webview relies on for final UI state and analytics. |
| promptRunStarted | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:976 (#handleExecutePrompt before queue dispatch) | Extension begins executing prompt runs after validation. | { runId: string, promptId: string, timestamp: number, streaming: boolean, results: PromptRunResultShell[], runSettings?: any }. | Initialises progress UI by describing planned result shells. |
| promptRunCompleted | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:994 (#handleExecutePrompt cancel branch)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1240 (#handleExecutePrompt final success path) | All result jobs finish or run is cancelled. | { runId: string, promptId: string, timestamp: number, success: boolean, results: PromptRunResultData[] }. | Paired with promptExecutionResult to signal lifecycle end for the run header. |
| promptRunResultCompleted | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1121 (success result)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1147 (failure result)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1175 (exception path)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1214 (cancelled result) | Each individual job finishes streaming or encounters an error. | { runId: string, promptId: string, timestamp: number, result: PromptRunResultData }. | Allows webview to update per-result cards incrementally and merge usage data. |
| executePromptFromCommand | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1276 (runPromptFromCommand) | VS Code command palette entry wants to start execution from outside the panel. | None. | Tells the webview to surface the run dialog using last execution payload. |
| sync-update | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1372 (#initializeCodeSyncManager.onRemoteChange)<br>pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1400 (#handleSyncStateVector response) | CRDT manager publishes Yjs update or responds to state-vector pull. | { resource: SyncResource.Code, payload: { update: number[] } }. | Binary update is sent as array for webview to apply to its Yjs doc. |
| sync-state-vector | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1413 (#handleRequestSync) | Extension responds to sync-init by sending current state vector. | { resource: SyncResource.Code, payload: { stateVector: number[] } }. | Kickstarts CRDT reconciliation when the webview attaches to a resource. |

## Webview -> Extension

<!-- prettier-ignore -->
| Type | Source | Trigger | Payload | Notes |
| --- | --- | --- | --- | --- |
| sync-update | pkgs/vsc-webview/src/hooks/useCodeSync.ts:76 (useEffect update handler) | Local Yjs document emits an update after user edits. | { resource: SyncResource, payload: { update: number[] } }. | Pushes CRDT diff chunks upstream so extension can apply remote changes. |
| sync-init | pkgs/vsc-webview/src/hooks/useCodeSync.ts:86 (useEffect init) | Code sync hook mounts and requests initial state. | { type: "sync-init", resource: SyncResource }. | Kickstarts sync handshake when the code editor component attaches. |
| sync-state-vector | pkgs/vsc-webview/src/hooks/useCodeSync.ts:184 (handleSyncMessage stateVector response) | Extension asks for state vector; webview returns encoded update. | { resource: SyncResource, payload: { stateVector: number[] } }. | Provides current Yjs state to extension for reconciliation. |
| getModelsDev | pkgs/vsc-webview/src/aspects/models-dev/Context.tsx:96 (fetchModelsDev) | ModelsDevProvider needs catalog via VS Code bridge. | { type: "getModelsDev" }. | Requests extension to fetch/cached models.dev payload through extension-side fetch. |
| webviewReady | pkgs/vsc-webview/src/app/Index.tsx:131 (useEffect mount) | Workbench Index hydrating and registering message listener. | { type: "webviewReady" }. | Signals extension to send initial state and flush pending actions. |
| setVercelGatewayKey | pkgs/vsc-webview/src/app/Index.tsx:146 (handleVercelGatewayKeyChange) | User submits new Vercel Gateway API key in auth panel. | { type: "setVercelGatewayKey", payload: string }. | Persists secret via extension secret storage. |
| clearVercelGatewayKey | pkgs/vsc-webview/src/app/Index.tsx:153 (handleClearVercelGatewayKey) | User clears stored Vercel key. | { type: "clearVercelGatewayKey" }. | Asks extension to remove secret and reset auth context. |
| revealPrompt | pkgs/vsc-webview/src/app/Index.tsx:208 (handlePromptSelect) | Prompt list selection sends reveal request to VS Code. | { type: "revealPrompt", payload: { file: string, selection: { start: number, end: number } } }. | Lets extension focus the editor on the chosen prompt span. |
| getStreamingPreference | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:399 (useEffect) | Assessment panel mounts and needs streaming toggle default. | { type: "getStreamingPreference" }. | Reads persisted preference stored in extension globalState. |
| stopPromptRun | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:704 (handleStop) | User hits Stop while a run is in flight. | { type: "stopPromptRun", payload: { runId: string } }. | Requests extension to abort active AI run controllers. |
| requestAttachmentPick | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:894 (requestAttachments) | User chooses to attach files/images to a run configuration. | { type: "requestAttachmentPick", payload: { imagesOnly: boolean } }. | Delegates file picker to extension; imagesOnly toggles filter. |
| requestCsvPick | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:1296 (handleLoadCsv) | Assessment UI wants to import CSV dataset. | { type: "requestCsvPick" }. | Triggers extension quick pick to choose CSV and return contents. |
| executePrompt | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:1487 (handleExecute) | User runs prompt with prepared models/config. | { type: "executePrompt", payload: ExecutePayload }. | Primary execution request containing prompt text, variables, models, attachments, run settings. |
| setStreamingPreference | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:2673 (streaming toggle onChange) | User toggles “Stream output” checkbox. | { type: "setStreamingPreference", payload: { enabled: boolean } }. | Updates persisted run preference and informs extension controllers. |

## Webview Subscriptions

<!-- prettier-ignore -->
| Type | Handler | Source | Notes |
| --- | --- | --- | --- |
| settingsUpdated | SettingsProvider.messageHandler | pkgs/vsc-webview/src/aspects/settings/Context.tsx:22 | Updates context state when extension pushes fresh settings. |
| modelsDev | fetchModelsDev.handleMessage | pkgs/vsc-webview/src/aspects/models-dev/Context.tsx:79 | Resolves/rejects models.dev fetch promise with cached data or error. |
| activeFileChanged | Index.handleMessage | pkgs/vsc-webview/src/app/Index.tsx:66 | Hydrates active file state and refreshes pinned prompt snapshot. |
| fileContentChanged | Index.handleMessage | pkgs/vsc-webview/src/app/Index.tsx:70 | Updates editor state for in-flight edits and reruns prompt parsing. |
| fileSaved | Index.handleMessage | pkgs/vsc-webview/src/app/Index.tsx:76 | Notifies webview that file persisted; keeps active file in sync. |
| cursorPositionChanged | Index.handleMessage | pkgs/vsc-webview/src/app/Index.tsx:82 | Tracks cursor offset for prompt selection and pinning logic. |
| vercelGatewayKeyChanged | Index.handleMessage | pkgs/vsc-webview/src/app/Index.tsx:88 | Stores latest secret state for auth UI and context. |
| openVercelGatewayPanel | Index.handleMessage | pkgs/vsc-webview/src/app/Index.tsx:92 | Triggers gateway panel open signal when extension requests it. |
| promptsChanged | Index.handleMessage | pkgs/vsc-webview/src/app/Index.tsx:96 | Refreshes parsed prompts, parse status, and pinned prompt copies. |
| sync-update | Index.handleMessage | pkgs/vsc-webview/src/app/Index.tsx:122 | Forwards CRDT update payloads to registered sync handler. |
| sync-state-vector | Index.handleMessage | pkgs/vsc-webview/src/app/Index.tsx:123 | Passes state vector responses into sync handler for handshake. |
| csvFileLoaded | Assessment.handleCsv | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:1200 | Loads parsed CSV data into assessment dataset state or logs errors. |
| attachmentsLoaded | Assessment.handleAttachments | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:1230 | Assigns picked attachments to the pending model config target. |
| promptRunStarted | Assessment.handleMessage | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:1514 | Initialises streaming UI and result shells for the active run. |
| promptRunUpdate | Assessment.handleMessage | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:1517 | Appends streamed deltas to result buffers while run active. |
| promptRunCompleted | Assessment.handleMessage | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:1520 | Marks streaming run finished and updates aggregated status. |
| promptRunError | Assessment.handleMessage | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:1523 | Surfaces execution errors and aborts run state if matching runId. |
| promptRunResultCompleted | Assessment.handleMessage | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:1526 | Finalises individual result cards with success/failure metadata. |
| streamingPreference | Assessment.handleMessage | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:1530 | Keeps streaming toggle state aligned with extension preference. |
| promptExecutionResult | Assessment.handleMessage | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:1533 | Writes final execution summary, collapses streaming state, and records history. |
| executePromptFromCommand | Assessment.commandHandler | pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx:1638 | Runs the prepared execution flow when extension triggers command callback. |

## Extension Subscriptions

<!-- prettier-ignore -->
| Type | Handler | Source | Notes |
| --- | --- | --- | --- |
| addItWorks | WorkbenchViewProvider.#handleAddItWorks | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:528 | Adds “// It works!” comment to active file via FileManager for debugging. |
| revealPrompt | WorkbenchViewProvider.#handleRevealPrompt | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:396 | Opens target file in VS Code, selects prompt span, and reveals it in editor. |
| requestCsvPick | WorkbenchViewProvider.#handleRequestCsvPick | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:532 | Shows CSV quick pick/open dialog, reads file, returns content or error. |
| requestAttachmentPick | WorkbenchViewProvider.#handleRequestAttachmentPick | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:627 | Prompts for attachments with optional images-only filter; responds with base64 payloads. |
| getModelsDev | WorkbenchViewProvider.#handleGetModelsDev | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:370 | Fetches models.dev catalog (cached) and replies with data or error payload. |
| webviewReady | WorkbenchViewProvider.#handleWebviewReady | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:126 | Sends initial active file, prompts, and pending Vercel panel open signal. |
| getVercelGatewayKey | WorkbenchViewProvider.#sendVercelGatewayKey | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:724 | Reads secret storage and emits current Vercel Gateway key to webview. |
| setVercelGatewayKey | WorkbenchViewProvider.#handleSetVercelGatewayKey | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:733 | Persists provided key to secret storage (no immediate response). |
| clearVercelGatewayKey | WorkbenchViewProvider.#handleClearVercelGatewayKey | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:738 | Deletes stored key; secret change callback broadcasts null key. |
| getStreamingPreference | WorkbenchViewProvider.#handleGetStreamingPreference | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:743 | Reads VS Code globalState flag and replies with current streaming enabled value. |
| setStreamingPreference | WorkbenchViewProvider.#handleSetStreamingPreference | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:755 | Updates globalState and echoes new streaming preference back to webview. |
| sync-update | WorkbenchViewProvider.#handleSyncUpdate | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1382 | Applies incoming CRDT updates from webview to CodeSyncManager and VS Code buffer. |
| sync-state-vector | WorkbenchViewProvider.#handleSyncStateVector | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1394 | Generates delta against provided state vector and replies with sync-update payload. |
| sync-init | WorkbenchViewProvider.#handleRequestSync | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1408 | Responds to sync-init by sending current state vector of active document. |
| executePrompt | WorkbenchViewProvider.#handleExecutePrompt | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:785 | Validates prompt payload, orchestrates AIService runs, streams updates/results back. |
| stopPromptRun | WorkbenchViewProvider.#handleStopPromptRun | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:1300 | Aborts matching in-flight runs by cancelling stored AbortControllers. |

## Shared Types

<!-- prettier-ignore -->
| Type Definition | Module | Direction | Notes |
| --- | --- | --- | --- |
| SyncMessage (Update/StateVector/Init) | @wrkspc/vsc-sync/src/message.ts | Bidirectional | Defines CRDT sync message variants (type, resource, payload) already shared between webview and extension. |
| SyncResource.Code | @wrkspc/vsc-sync/src/resource.ts | Shared | Single resource discriminator for sync messages; currently only code files with path string. |
| PromptRunMessage & payloads | @wrkspc/vsc-types/src/index.ts | Extension -> Webview | Exports PromptRunStarted/Update/Completed/Error/ResultCompleted message interfaces plus supporting payload types for streaming UX. |
| PromptRunResultShell / PromptRunResultData | @wrkspc/vsc-types/src/index.ts | Extension -> Webview | Reusable result structures that webview consumes and extension populates for run summaries. |
| ExecutePromptPayload (local) | pkgs/vsc-extension/src/WorkbenchView/Provider.ts:33 | Webview -> Extension (ad-hoc) | Inline interface describing executePrompt payload (prompt text, variables, runs, models, attachments); not exported anywhere else. |

## Message Matrix

<!-- prettier-ignore -->
| Type | Direction | Source | Destination | Domain | Notes |
| --- | --- | --- | --- | --- | --- |
| activeFileChanged | Extension -> Webview | WorkbenchViewProvider (#handleWebviewReady / FileManager callbacks) | Index.handleMessage | file | Sends SyncFile.State to hydrate panels and keep cursor/prompt context aligned. |
| fileContentChanged | Extension -> Webview | WorkbenchViewProvider (#initializeFileManager) | Index.handleMessage | file | Pushes edited file content so webview updates prompt previews. |
| fileSaved | Extension -> Webview | WorkbenchViewProvider (#initializeFileManager) | Index.handleMessage | file | Signals persistence of the tracked file; used for UI confirmation. |
| cursorPositionChanged | Extension -> Webview | WorkbenchViewProvider (#initializeFileManager) | Index.handleMessage | file | Keeps webview cursor state for prompt detection and pinning. |
| promptsChanged | Extension -> Webview | WorkbenchViewProvider (#parseAndSendPrompts) | Index.handleMessage | prompts | Delivers parsed prompt list plus status/error fields on file changes. |
| modelsDev | Extension -> Webview | WorkbenchViewProvider (#handleGetModelsDev) | ModelsDevContext.fetchModelsDev handler | models | Responds to getModelsDev request with cached or fetched provider metadata. |
| csvFileLoaded | Extension -> Webview | WorkbenchViewProvider (#handleRequestCsvPick) | Assessment.handleCsv | dataset | Returns CSV path/content or error after quick pick dialog completes. |
| attachmentsLoaded | Extension -> Webview | WorkbenchViewProvider (#handleRequestAttachmentPick) | Assessment.handleAttachments | attachments | Supplies base64-encoded attachments with mime metadata after picker selection. |
| settingsUpdated | Extension -> Webview | VscSettingsController via WorkbenchViewProvider | SettingsProvider.messageHandler | settings | Broadcasts merged workspace settings into webview context. |
| vercelGatewayKeyChanged | Extension -> Webview | SecretManager callbacks / #sendVercelGatewayKey | Index.handleMessage | auth | Updates auth panel when secret storage changes or on initial hydrate. |
| streamingPreference | Extension -> Webview | #handleGetStreamingPreference / #handleSetStreamingPreference | Assessment.handleMessage | settings | Echoes persisted streaming toggle state back to assessment UI. |
| openVercelGatewayPanel | Extension -> Webview | WorkbenchViewProvider (webviewReady / openVercelGatewayPanel) | Index.handleMessage | auth | Notifies webview to open API key panel when command invoked during load. |
| promptRunStarted | Extension -> Webview | #handleExecutePrompt | Assessment.handleMessage | prompt | Kicks off streaming UI with run metadata and shells. |
| promptRunUpdate | Extension -> Webview | #handleExecutePrompt (sendRunUpdate) | Assessment.handleMessage | prompt | Streams incremental deltas (text/tool) for active result cards. |
| promptRunResultCompleted | Extension -> Webview | #handleExecutePrompt | Assessment.handleMessage | prompt | Marks individual run result success/failure and attaches metadata. |
| promptRunCompleted | Extension -> Webview | #handleExecutePrompt | Assessment.handleMessage | prompt | Signals run completion and aggregates results for summary UI. |
| promptRunError | Extension -> Webview | #handleExecutePrompt (sendRunError) | Assessment.handleMessage | prompt | Surfaces per-run or global failures with timestamps and optional resultId. |
| promptExecutionResult | Extension -> Webview | #handleExecutePrompt | Assessment.handleMessage | prompt | Final summary payload for runs (success flag, results array, errors). |
| executePromptFromCommand | Extension -> Webview | WorkbenchViewProvider.runPromptFromCommand | Assessment.commandHandler | prompt | Tells webview to launch execution when VS Code command palette is used. |
| addItWorks | Webview -> Extension | (No known sender; dev hook) | WorkbenchViewProvider.#handleAddItWorks | dev | Debug hook to append “// It works!” comment; currently unused in webview. |
| sync-update | Bidirectional | useCodeSync update handler / WorkbenchViewProvider.#handleSyncStateVector | WorkbenchViewProvider.#handleSyncUpdate / useCodeSync.handleSyncMessage | sync | Yjs update payload exchanged both ways; webview sends edits, extension can respond with diff. |
| sync-state-vector | Bidirectional | WorkbenchViewProvider.#handleRequestSync / useCodeSync.handleSyncMessage | useCodeSync.handleSyncMessage / WorkbenchViewProvider.#handleSyncStateVector | sync | Carries state vectors during initial handshake and follow-up reconciliation. |
| sync-init | Webview -> Extension | useCodeSync useEffect init | WorkbenchViewProvider.#handleRequestSync | sync | Webview requests initial CRDT state for active resource. |
| getModelsDev | Webview -> Extension | ModelsDevProvider.fetchModelsDev | WorkbenchViewProvider.#handleGetModelsDev | models | Request/response pair for models.dev catalog (responds with modelsDev). |
| webviewReady | Webview -> Extension | Index.useEffect on mount | WorkbenchViewProvider.#handleWebviewReady | lifecycle | Signals readiness so extension can send initial state and pending actions. |
| setVercelGatewayKey | Webview -> Extension | Index.handleVercelGatewayKeyChange | WorkbenchViewProvider.#handleSetVercelGatewayKey | auth | User-provided gateway key persisted to VS Code secret storage. |
| clearVercelGatewayKey | Webview -> Extension | Index.handleClearVercelGatewayKey | WorkbenchViewProvider.#handleClearVercelGatewayKey | auth | Removes stored gateway key; extension emits vercelGatewayKeyChanged null afterwards. |
| getVercelGatewayKey | Webview -> Extension | (not currently emitted) | WorkbenchViewProvider.#sendVercelGatewayKey | auth | Extension supports request to resend key; webview does not call yet. |
| revealPrompt | Webview -> Extension | Index.handlePromptSelect | WorkbenchViewProvider.#handleRevealPrompt | prompts | Asks extension to open target file and highlight prompt span in editor. |
| getStreamingPreference | Webview -> Extension | Assessment.useEffect | WorkbenchViewProvider.#handleGetStreamingPreference | settings | Fetches persisted streaming toggle; extension responds with streamingPreference message. |
| setStreamingPreference | Webview -> Extension | Assessment streaming checkbox onChange | WorkbenchViewProvider.#handleSetStreamingPreference | settings | Updates stored streaming preference and triggers confirmation response. |
| requestAttachmentPick | Webview -> Extension | Assessment.requestAttachments | WorkbenchViewProvider.#handleRequestAttachmentPick | attachments | Asks extension to open multi-file picker (with optional imagesOnly flag). |
| requestCsvPick | Webview -> Extension | Assessment.handleLoadCsv | WorkbenchViewProvider.#handleRequestCsvPick | dataset | Requests CSV selection; extension responds with csvFileLoaded message. |
| executePrompt | Webview -> Extension | Assessment.handleExecute | WorkbenchViewProvider.#handleExecutePrompt | prompt | Primary run request with prompt text, variables, model configs, attachments. |
| stopPromptRun | Webview -> Extension | Assessment.handleStop | WorkbenchViewProvider.#handleStopPromptRun | prompt | User cancels active run; extension aborts controllers and sends cancellation updates. |

## Open Questions

- None.
