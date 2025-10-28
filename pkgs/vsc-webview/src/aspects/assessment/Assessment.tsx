import { PlaygroundState } from "@wrkspc/core/playground";
import { ModelSetups } from "../model/Setups";
import { Results } from "../result";

//#region Legacy

// interface ExecutionState {
//   isLoading: boolean;
//   results: RunResult[];
//   error: string | null;
//   timestamp?: number;
//   runId?: string | null;
//   promptId?: string | null;
//   startedAt?: number | null;
//   completedAt?: number | null;
// }

// function providerLabel(providerId: string): string {
//   if (!providerId) return "";
//   return providerId
//     .split(/[-_\\s]/g)
//     .filter(Boolean)
//     .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
//     .join(" ");
// }

//#endregion

export namespace Assessment {
  export interface Props {
    prompt: PlaygroundState.Prompt;
  }
}

export { AssessmentComponent as Assessment };

function AssessmentComponent(props: Assessment.Props) {
  //#region Legacy

  // const { send, useListen } = useMessages();
  // const attachmentTargetKeyRef = useRef<string | null>(null);

  // const [executionState, setExecutionState] = useState<ExecutionState>({
  //   isLoading: false,
  //   results: [],
  //   error: null,
  // });
  // const [streamingState, setStreamingState] =
  //   useState<AssessmentStreamingState>(() => createEmptyStreamingState());
  // const [isStopping, setIsStopping] = useState(false);
  // const activeRunIdRef = useRef<string | null>(null);
  // const promptVariables = useMemo(() => prompt?.vars ?? [], [prompt]);
  // const datasourceState = useAssessmentDatasourceState({
  //   promptVariables,
  //   onRequestCsv: () => send({ type: "dataset-wv-csv-request" }),
  // });
  // const {
  //   inputSource,
  //   setInputSource,
  //   datasetMode,
  //   setDatasetMode,
  //   variables,
  //   setVariables: setVariablesState,
  //   csvPath,
  //   setCsvPath,
  //   csvHeader,
  //   setCsvHeader,
  //   csvRows,
  //   setCsvRows,
  //   selectedRowIdx,
  //   setSelectedRowIdx,
  //   rangeStart,
  //   setRangeStart,
  //   rangeEnd,
  //   setRangeEnd,
  //   handleVariableChange,
  //   handleSelectRow,
  //   handleLoadCsv,
  //   handleClearCsv,
  //   usingCsv,
  //   csvFileLabel,
  // } = datasourceState;

  // const resultsView = useAssessmentResultsViewState();
  // const {
  //   layout: resultsLayout,
  //   setLayout: setResultsLayout,
  //   collapsedResults,
  //   setCollapsedResults,
  //   collapsedModelSettings,
  //   setCollapsedModelSettings,
  //   requestExpanded: expandedRequest,
  //   setRequestExpanded: setExpandedRequest,
  //   responseExpanded: expandedResponse,
  //   setResponseExpanded: setExpandedResponse,
  //   viewTabs,
  //   setViewTabs,
  //   activeResultIndex,
  //   setActiveResultIndex,
  // } = resultsView;
  // const streamingToggleId = useId();
  // const convertStreamingStateToResults = useCallback(
  //   (state: AssessmentStreamingState): RunResult[] => {
  //     if (!state.order.length) return [];
  //     return state.order.map((resultId) => {
  //       const streamingResult = state.results[resultId];
  //       if (!streamingResult) {
  //         const fallback: RunResult = {
  //           success: false,
  //           runId: state.runId ?? null,
  //           resultId,
  //           runLabel: "",
  //           label: resultId,
  //           prompt: null,
  //           text: null,
  //           textParts: [],
  //           streaming: state.streaming,
  //           isLoading: false,
  //           nonStreamingNote: null,
  //           error: "Result missing",
  //         };
  //         return fallback;
  //       }

  //       const metadata = streamingResult.metadata ?? {};
  //       const assembledText =
  //         typeof streamingResult.fullText === "string"
  //           ? streamingResult.fullText
  //           : streamingResult.textParts.join("");

  //       const runResult: RunResult = {
  //         success:
  //           streamingResult.success === null ? true : streamingResult.success,
  //         runId: state.runId ?? null,
  //         resultId: streamingResult.id,
  //         runLabel: streamingResult.runLabel,
  //         label: streamingResult.label,
  //         prompt: null,
  //         text: assembledText.length > 0 ? assembledText : null,
  //         textParts: [...streamingResult.textParts],
  //         streaming: streamingResult.streaming,
  //         isLoading: streamingResult.loading,
  //         nonStreamingNote: streamingResult.nonStreamingNote ?? null,
  //         error: streamingResult.error,
  //         model: {
  //           key: streamingResult.model.key,
  //           id: streamingResult.model.id,
  //           providerId: streamingResult.model.providerId,
  //           label: streamingResult.model.label ?? null,
  //           settings: streamingResult.model.settings,
  //         },
  //       };

  //       if (metadata.request !== undefined)
  //         runResult.request = metadata.request ?? null;
  //       if (metadata.response !== undefined)
  //         runResult.response = metadata.response ?? null;
  //       if (metadata.usage !== undefined)
  //         runResult.usage = metadata.usage ?? null;
  //       if (metadata.totalUsage !== undefined)
  //         runResult.totalUsage = metadata.totalUsage ?? null;
  //       if (metadata.steps !== undefined)
  //         runResult.steps = metadata.steps ?? null;
  //       if (metadata.finishReason !== undefined)
  //         runResult.finishReason = metadata.finishReason ?? null;
  //       if (metadata.warnings !== undefined)
  //         runResult.warnings = metadata.warnings ?? null;

  //       return runResult;
  //     });
  //   },
  //   [],
  // );

  // const updateStreamingState = useCallback(
  //   (
  //     updater: (previous: AssessmentStreamingState) => AssessmentStreamingState,
  //     overrides?: Partial<
  //       Pick<ExecutionState, "isLoading" | "error" | "timestamp">
  //     >,
  //   ) => {
  //     setStreamingState((prev) => {
  //       const next = updater(prev);
  //       setExecutionState((prevExec) => {
  //         const derivedResults = convertStreamingStateToResults(next);
  //         const loadingFromState = next.order.some(
  //           (id) => next.results[id]?.loading,
  //         );
  //         const timestampCandidate =
  //           overrides?.timestamp !== undefined
  //             ? overrides.timestamp
  //             : (next.completedAt ?? prevExec.timestamp);

  //         const nextExecutionState: ExecutionState = {
  //           isLoading:
  //             overrides?.isLoading !== undefined
  //               ? overrides.isLoading
  //               : loadingFromState,
  //           results: derivedResults,
  //           error: overrides?.error ?? next.error ?? null,
  //           runId: next.runId,
  //           promptId: next.promptId,
  //           startedAt: next.startedAt,
  //           completedAt: next.completedAt,
  //         };

  //         if (timestampCandidate !== undefined)
  //           nextExecutionState.timestamp = timestampCandidate;
  //         else if (prevExec.timestamp !== undefined)
  //           nextExecutionState.timestamp = prevExec.timestamp;

  //         return nextExecutionState;
  //       });
  //       return next;
  //     });
  //   },
  //   [convertStreamingStateToResults],
  // );

  // const resetPerRunUiState = useCallback(() => {
  //   setCollapsedResults({});
  //   setCollapsedModelSettings({});
  //   setExpandedRequest({});
  //   setExpandedResponse({});
  //   setViewTabs({});
  //   setActiveResultIndex(0);
  // }, [
  //   setActiveResultIndex,
  //   setCollapsedModelSettings,
  //   setCollapsedResults,
  //   setExpandedRequest,
  //   setExpandedResponse,
  //   setViewTabs,
  // ]);

  // // Handlers for streaming lifecycle events are defined after promptId is available.

  // const persistedStateRef = useRef<PersistedPromptState | undefined>(undefined);
  // const [isHydrated, setIsHydrated] = useState(false);

  // // const {
  // //   // gateway,
  // //   // gatewayModels,
  // //   // gatewayError,
  // //   // dotDevError,
  // //   // isDotDevFallback: modelsDevFallback,
  // //   // isLoading: modelsLoading,
  // //   // providers: modelsDevProviders,
  // //   // modelsByProvider,
  // //   // getModel: getModelsDevMeta,
  // // } = useModels();

  // // const manualModelFallback = useMemo<AvailableModel[]>(() => {
  // //   return Object.entries(OFFLINE_MODEL_RECOMMENDATIONS).flatMap(
  // //     ([providerId, entries]) =>
  // //       Object.keys(entries).map((modelId) => {
  // //         const meta = getModelsDevMeta(providerId, modelId) as
  // //           | { name?: string }
  // //           | undefined;
  // //         return {
  // //           id: modelId,
  // //           name: meta?.name ?? modelId,
  // //           specification: { provider: providerId },
  // //         };
  // //       }),
  // //   );
  // // }, [getModelsDevMeta]);

  // // const models = useMemo<AvailableModel[]>(() => {
  // //   if (gatewayModels && gatewayModels.length > 0) return gatewayModels;
  // //   return manualModelFallback;
  // // }, [gatewayModels, manualModelFallback]);

  // // const modelsError = useMemo(() => {
  // //   if (gateway?.response.status === "error") return gateway.response.message;
  // //   return null;
  // // }, [gateway]);

  // // const modelStatus = useMemo<ModelStatus>(() => {
  // //   if (gateway?.response.status === "error" || dotDevError) return "error";
  // //   if (modelsLoading) return "loading";
  // //   return "success";
  // // }, [dotDevError, gateway, modelsLoading]);

  // useEffect(() => {
  //   if (resultsLayout !== "vertical") setCollapsedResults({});
  // }, [resultsLayout, setCollapsedResults]);

  // const promptId = prompt
  //   ? `${prompt.file}:${prompt.span.outer.start}-${prompt.span.outer.end}`
  //   : null;

  // const handleRunStarted = useCallback(
  //   (payload: PromptRunStartedPayload) => {
  //     if (payload.promptId !== promptId) return;

  //     activeRunIdRef.current = payload.runId;
  //     resetPerRunUiState();
  //     setIsStopping(false);

  //     const results: Record<string, AssessmentStreamingResult> = {};
  //     const nonStreamingCopy =
  //       "Streaming is unavailable. Results will appear when the run completes.";
  //     const runStreamingEnabled = payload.streaming !== false;

  //     payload.results.forEach((shell) => {
  //       results[shell.resultId] = {
  //         id: shell.resultId,
  //         label: shell.label,
  //         runLabel: shell.runLabel,
  //         model: shell.model,
  //         streaming: shell.streaming,
  //         textParts: [],
  //         fullText: null,
  //         success: null,
  //         error: null,
  //         loading: true,
  //         nonStreamingNote:
  //           runStreamingEnabled && shell.streaming === false
  //             ? nonStreamingCopy
  //             : null,
  //         metadata: {},
  //       };
  //     });

  //     updateStreamingState(
  //       () => ({
  //         runId: payload.runId,
  //         promptId: payload.promptId,
  //         streaming: payload.streaming,
  //         startedAt: payload.timestamp,
  //         completedAt: null,
  //         results,
  //         order: payload.results
  //           .map((r) => r.resultId)
  //           .filter((id): id is string => typeof id === "string"),
  //         error: null,
  //       }),
  //       { isLoading: true, error: null, timestamp: payload.timestamp },
  //     );
  //   },
  //   [promptId, resetPerRunUiState, updateStreamingState],
  // );

  // const handleRunUpdate = useCallback(
  //   (payload: PromptRunUpdatePayload) => {
  //     if (payload.promptId !== promptId) return;
  //     if (activeRunIdRef.current && payload.runId !== activeRunIdRef.current)
  //       return;

  //     const resultId = payload.resultId;
  //     if (!resultId) return;

  //     updateStreamingState((prev) => {
  //       if (prev.runId && payload.runId && prev.runId !== payload.runId)
  //         return prev;

  //       const target = prev.results[resultId];
  //       if (!target) return prev;

  //       let updated: AssessmentStreamingResult = target;
  //       const delta = payload.delta;

  //       if (delta.type === "text")
  //         updated = appendTextChunk(target, delta.text);

  //       const nextResults = {
  //         ...prev.results,
  //         [resultId]: updated,
  //       };

  //       return { ...prev, results: nextResults };
  //     });
  //   },
  //   [promptId, updateStreamingState],
  // );

  // const handleRunCompleted = useCallback(
  //   (payload: VscMessagePromptRun.ExtCompletePayload) => {
  //     if (payload.promptId !== promptId) return;
  //     if (activeRunIdRef.current && payload.runId !== activeRunIdRef.current)
  //       return;

  //     activeRunIdRef.current = null;
  //     setIsStopping(false);

  //     updateStreamingState(
  //       (prev) => {
  //         if (prev.runId && payload.runId && prev.runId !== payload.runId)
  //           return prev;

  //         const nextResults = { ...prev.results };
  //         for (const result of payload.results) {
  //           const resultId = result.resultId;
  //           if (!resultId) continue;
  //           const existing = nextResults[resultId];
  //           const baseStreamingFlag = existing?.streaming ?? prev.streaming;
  //           const resolvedModel = result.model ?? existing?.model ?? null;
  //           if (!resolvedModel) continue;
  //           const base: AssessmentStreamingResult = existing
  //             ? { ...existing }
  //             : {
  //                 id: result.resultId,
  //                 label: result.label ?? result.resultId,
  //                 runLabel: result.runLabel ?? "",
  //                 model: resolvedModel,
  //                 streaming: baseStreamingFlag ?? true,
  //                 textParts: [],
  //                 fullText: null,
  //                 success: null,
  //                 error: null,
  //                 loading: true,
  //                 nonStreamingNote: null,
  //                 metadata: {},
  //               };

  //           const finalText =
  //             typeof result.text === "string"
  //               ? result.text
  //               : (base.fullText ?? null);

  //           base.fullText = finalText;
  //           base.textParts = finalText ? [finalText] : base.textParts;
  //           base.success = result.success;
  //           base.error = result.error ?? null;
  //           base.loading = false;

  //           const mergedMetadata = {
  //             ...(base.metadata ?? {}),
  //           } as NonNullable<AssessmentStreamingResult["metadata"]>;
  //           if (result.usage !== undefined)
  //             mergedMetadata.usage = result.usage ?? null;
  //           if (result.totalUsage !== undefined)
  //             mergedMetadata.totalUsage = result.totalUsage ?? null;
  //           if (result.steps !== undefined)
  //             mergedMetadata.steps = result.steps ?? null;
  //           if (result.finishReason !== undefined)
  //             mergedMetadata.finishReason = result.finishReason ?? null;
  //           if (result.warnings !== undefined)
  //             mergedMetadata.warnings = result.warnings ?? null;
  //           if (result.request !== undefined)
  //             mergedMetadata.request = result.request ?? null;
  //           if (result.response !== undefined)
  //             mergedMetadata.response = result.response ?? null;

  //           base.metadata = mergedMetadata;

  //           nextResults[resultId] = base;
  //         }

  //         return {
  //           ...prev,
  //           runId: null,
  //           results: nextResults,
  //           completedAt: payload.timestamp,
  //           error: payload.success ? null : (prev.error ?? null),
  //         };
  //       },
  //       { isLoading: false, timestamp: payload.timestamp },
  //     );
  //   },
  //   [promptId, updateStreamingState],
  // );

  // const handleRunResultCompleted = useCallback(
  //   (payload: PromptRunResultCompletedPayload) => {
  //     if (payload.promptId !== promptId) return;

  //     updateStreamingState((prev) => {
  //       if (prev.runId && payload.runId && prev.runId !== payload.runId)
  //         return prev;

  //       const resultId = payload.result.resultId;
  //       const existing = prev.results[resultId];
  //       if (!existing) return prev;

  //       const metadata = { ...(existing.metadata ?? {}) };
  //       if (payload.result.request !== undefined)
  //         metadata.request = payload.result.request ?? null;
  //       if (payload.result.response !== undefined)
  //         metadata.response = payload.result.response ?? null;
  //       if (payload.result.usage !== undefined)
  //         metadata.usage = payload.result.usage ?? null;
  //       if (payload.result.totalUsage !== undefined)
  //         metadata.totalUsage = payload.result.totalUsage ?? null;
  //       if (payload.result.steps !== undefined)
  //         metadata.steps = payload.result.steps ?? null;
  //       if (payload.result.finishReason !== undefined)
  //         metadata.finishReason = payload.result.finishReason ?? null;
  //       if (payload.result.warnings !== undefined)
  //         metadata.warnings = payload.result.warnings ?? null;

  //       const textProvided = payload.result.text !== undefined;
  //       const providedText =
  //         textProvided && payload.result.text !== undefined
  //           ? payload.result.text
  //           : null;
  //       const finalText =
  //         textProvided && providedText !== null
  //           ? providedText
  //           : existing.fullText;
  //       const nextTextParts =
  //         textProvided && providedText !== null
  //           ? [providedText]
  //           : existing.textParts;

  //       const nextResults = {
  //         ...prev.results,
  //         [resultId]: {
  //           ...existing,
  //           success: payload.result.success,
  //           error: payload.result.error ?? null,
  //           loading: false,
  //           fullText: finalText ?? null,
  //           textParts: nextTextParts,
  //           metadata,
  //         },
  //       };

  //       return { ...prev, results: nextResults };
  //     });
  //   },
  //   [promptId, updateStreamingState],
  // );

  // const handleRunError = useCallback(
  //   (payload: VscMessagePromptRun.ExtErrorPayload) => {
  //     if (payload.promptId !== promptId) return;

  //     if (payload.resultId) {
  //       const resultId = payload.resultId;
  //       updateStreamingState((prev) => {
  //         if (prev.runId && payload.runId && prev.runId !== payload.runId)
  //           return prev;

  //         const target = prev.results[resultId];
  //         if (!target) return prev;

  //         const nextResults = {
  //           ...prev.results,
  //           [resultId]: {
  //             ...target,
  //             error: payload.error,
  //             loading: false,
  //             success: false,
  //           },
  //         };

  //         return { ...prev, results: nextResults };
  //       });
  //     } else {
  //       activeRunIdRef.current = null;
  //       setIsStopping(false);
  //       updateStreamingState(
  //         (prev) => {
  //           const nextResults: Record<string, AssessmentStreamingResult> = {};
  //           for (const [id, value] of Object.entries(prev.results))
  //             nextResults[id] = { ...value, loading: false };
  //           return {
  //             ...prev,
  //             runId: null,
  //             results: nextResults,
  //             error: payload.error,
  //             completedAt: payload.timestamp,
  //           };
  //         },
  //         {
  //           isLoading: false,
  //           error: payload.error,
  //           timestamp: payload.timestamp,
  //         },
  //       );
  //     }
  //     setIsStopping(false);
  //   },
  //   [promptId, updateStreamingState],
  // );

  // const handleExecutionResult = useCallback(
  //   (payload: VscMessagePromptRun.ExtExecutionResult["payload"]) => {
  //     if (payload.promptId !== promptId) return;

  //     const timestamp = payload.timestamp || Date.now();
  //     const resultsArray = (
  //       Array.isArray(payload.results) ? payload.results : []
  //     ) as RunResult[];

  //     const currentRunId = activeRunIdRef.current;

  //     if (payload.runId && currentRunId) {
  //       if (payload.runId !== currentRunId) return;
  //       activeRunIdRef.current = null;
  //       updateStreamingState(
  //         (prev) => {
  //           const nextResults = { ...prev.results };
  //           for (const result of resultsArray) {
  //             const resultId = result.resultId;
  //             if (!resultId) continue;
  //             const existing = nextResults[resultId];
  //             if (!existing) continue;
  //             const finalText =
  //               typeof result.text === "string"
  //                 ? result.text
  //                 : (existing.fullText ?? null);
  //             const existingMetadata = existing.metadata ?? {};
  //             const mergedMetadata = {
  //               ...existingMetadata,
  //               usage: result.usage ?? existingMetadata.usage,
  //               totalUsage: result.totalUsage ?? existingMetadata.totalUsage,
  //               steps: result.steps ?? existingMetadata.steps,
  //               finishReason:
  //                 result.finishReason ?? existingMetadata.finishReason,
  //               warnings: result.warnings ?? existingMetadata.warnings,
  //               request: result.request ?? existingMetadata.request,
  //               response: result.response ?? existingMetadata.response,
  //             };

  //             nextResults[resultId] = {
  //               ...existing,
  //               fullText: finalText ?? null,
  //               textParts: finalText ? [finalText] : existing.textParts,
  //               success: result.success,
  //               error: result.error ?? existing.error,
  //               loading: false,
  //               metadata: mergedMetadata,
  //             };
  //           }

  //           return {
  //             ...prev,
  //             results: nextResults,
  //             completedAt: timestamp,
  //             error: payload.error ?? prev.error ?? null,
  //           };
  //         },
  //         {
  //           isLoading: false,
  //           error: payload.error ?? null,
  //           timestamp,
  //         },
  //       );
  //     } else {
  //       setExecutionState({
  //         isLoading: false,
  //         results: resultsArray,
  //         error: payload.error || null,
  //         timestamp,
  //         runId: payload.runId ?? null,
  //         promptId: payload.promptId ?? null,
  //         startedAt: null,
  //         completedAt: timestamp,
  //       });
  //     }

  //     resetPerRunUiState();
  //     setIsStopping(false);
  //   },
  //   [
  //     promptId,
  //     resetPerRunUiState,
  //     setExecutionState,
  //     setIsStopping,
  //     updateStreamingState,
  //   ],
  // );

  // useListen(
  //   "prompt-run-ext-start",
  //   (message) => {
  //     handleRunStarted(message.payload);
  //   },
  //   [handleRunStarted],
  // );

  // useListen(
  //   "prompt-run-ext-update",
  //   (message) => {
  //     handleRunUpdate(message.payload);
  //   },
  //   [handleRunUpdate],
  // );

  // useListen(
  //   "prompt-run-ext-complete",
  //   (message) => {
  //     handleRunCompleted(message.payload);
  //   },
  //   [handleRunCompleted],
  // );

  // useListen(
  //   "prompt-run-ext-error",
  //   (message) => {
  //     handleRunError(message.payload);
  //   },
  //   [handleRunError],
  // );

  // useListen(
  //   "prompt-run-ext-result-complete",
  //   (message) => {
  //     handleRunResultCompleted(message.payload);
  //   },
  //   [handleRunResultCompleted],
  // );

  // useListen(
  //   "prompt-run-ext-execution-result",
  //   (message) => {
  //     handleExecutionResult(message.payload);
  //   },
  //   [handleExecutionResult],
  // );

  // const [streamingEnabled, setStreamingEnabled] = useStoreState(
  //   "global",
  //   "playground.streaming",
  // );

  // const handleStop = useCallback(() => {
  //   const runId =
  //     activeRunIdRef.current ??
  //     streamingState.runId ??
  //     executionState.runId ??
  //     null;
  //   if (!runId || isStopping) return;
  //   setIsStopping(true);
  //   send({ type: "prompt-run-vw-stop", payload: { runId } });
  // }, [executionState.runId, isStopping, send, streamingState.runId]);

  // const promptSource = useMemo(
  //   () => (prompt ? extractPromptText(fileContent, prompt) : ""),
  //   [prompt, fileContent],
  // );

  // const promptMeta = useMemo<PromptMeta | null>(() => {
  //   if (!prompt) return null;
  //   return {
  //     file: prompt.file,
  //     index: promptIndex,
  //     span: {
  //       start: prompt.span.outer.start,
  //       end: prompt.span.outer.end,
  //     },
  //     vars: (prompt.vars || []).map((variable) => variable.exp),
  //     source: promptSource,
  //   };
  // }, [prompt, promptIndex, promptSource]);

  // const providerOptions = useMemo<ModelProviderOption[]>(() => {
  //   const map = new Map<string, ModelProviderOption>();
  //   for (const model of models) {
  //     const providerId = normaliseProviderId(providerFromEntry(model));
  //     if (!providerId) continue;
  //     if (!map.has(providerId)) {
  //       const providerMeta = modelsDevProviders[providerId];
  //       map.set(providerId, {
  //         id: providerId,
  //         label:
  //           typeof providerMeta?.name === "string"
  //             ? providerMeta.name
  //             : providerLabel(providerId),
  //       });
  //     }
  //   }
  //   return Array.from(map.values()).sort((a, b) => {
  //     const scoreA = PROVIDER_POPULARITY[a.id] ?? 0;
  //     const scoreB = PROVIDER_POPULARITY[b.id] ?? 0;
  //     if (scoreA !== scoreB) return scoreB - scoreA;
  //     return a.label.localeCompare(b.label);
  //   });
  // }, [models, modelsDevProviders]);

  // const groupedModelsByProvider = useMemo<
  //   Record<string, ModelSelectorOption[]>
  // >(() => {
  //   const grouped: Record<string, ProviderModelWithScore[]> = {};

  //   for (const model of models) {
  //     const providerId = normaliseProviderId(providerFromEntry(model));
  //     if (!providerId) continue;
  //     if (!grouped[providerId]) grouped[providerId] = [];
  //     const meta = getModelsDevMeta(providerId, model.id) as
  //       | { last_updated?: string; name?: string }
  //       | undefined;
  //     const displayName = model.name ?? meta?.name ?? null;
  //     grouped[providerId]!.push({
  //       id: model.id,
  //       ...(displayName ? { name: displayName } : {}),
  //       lastUpdatedMs: parseLastUpdatedMs(meta?.last_updated),
  //       recommendationScore: 0,
  //     });
  //   }

  //   const result: Record<string, ModelSelectorOption[]> = {};

  //   Object.entries(grouped).forEach(([providerId, list]) => {
  //     const orderingEntries = list.map(({ id, name, lastUpdatedMs }) =>
  //       name ? { id, name, lastUpdatedMs } : { id, lastUpdatedMs },
  //     );
  //     const recommendationWeights = computeRecommendationWeightsForProvider(
  //       providerId,
  //       orderingEntries,
  //       { modelsDevFallback },
  //     );

  //     const offlineWeights = OFFLINE_MODEL_RECOMMENDATIONS[providerId] ?? {};

  //     list.forEach((entry) => {
  //       const key = modelKeyFromId(entry.id);
  //       const fallbackScore = offlineWeights[key] ?? 0;
  //       entry.recommendationScore = recommendationWeights[key] ?? fallbackScore;
  //     });

  //     list.sort(compareProviderModelEntries);

  //     result[providerId] = list.map(({ id, name }) => ({
  //       id,
  //       label: name ?? id,
  //     }));
  //   });

  //   return result;
  // }, [models, getModelsDevMeta, modelsDevFallback]);

  // const getModelsForProvider = useCallback(
  //   (providerId: string | null) => {
  //     const providerKey = normaliseProviderId(providerId);
  //     const list = groupedModelsByProvider[providerKey] ?? [];
  //     return list;
  //   },
  //   [groupedModelsByProvider],
  // );

  // const modelState = useModelSetupsState({
  //   models,
  //   providerOptions,
  //   groupedModelsByProvider,
  //   normaliseProviderId,
  // });

  // const {
  //   configs: modelConfigs,
  //   errors: modelErrors,
  //   expandedKey: expandedModelKey,
  //   setExpandedKey,
  //   addConfig,
  //   removeConfig,
  //   replaceAllConfigs,
  //   replaceAllErrors,
  //   updateConfig: updateModelConfig,
  //   updateErrors: updateModelErrors,
  //   handleProviderChange: changeModelProvider,
  //   handleModelChange: changeModelSelection,
  //   updateGenerationOption,
  //   updateReasoning,
  //   updateToolsJson,
  //   updateProviderOptionsJson,
  // } = modelState;

  // const activeModelKey = expandedModelKey ?? modelConfigs[0]?.key ?? null;
  // const activeModelConfig = useMemo(() => {
  //   if (!activeModelKey) return null;
  //   return modelConfigs.find((config) => config.key === activeModelKey) ?? null;
  // }, [modelConfigs, activeModelKey]);

  // const getModelEntry = useCallback(
  //   (config: ModelConfig | undefined | null) => {
  //     if (!config?.modelId) return undefined;
  //     return models.find((model) => model.id === config.modelId);
  //   },
  //   [models],
  // );

  // const getModelCapabilities = useCallback(
  //   (config: ModelConfig | undefined | null) => {
  //     const entry = getModelEntry(config);
  //     if (!entry)
  //       return {
  //         supportsImages: false,
  //         supportsVideo: false,
  //         supportsFiles: false,
  //         supportsTools: false,
  //         supportsReasoning: false,
  //         provider: normaliseProviderId(config?.providerId) || "",
  //       };
  //     return capsForEntry(entry as any);
  //   },
  //   [getModelEntry],
  // );

  // const handleDatasetLoad = useCallback(
  //   async (
  //     payload: Extract<
  //       VscMessageDataset,
  //       { type: "dataset-ext-csv-content" }
  //     >["payload"],
  //   ) => {
  //     if (payload.status === "error") {
  //       console.error("CSV load error", payload.error);
  //       return;
  //     }

  //     try {
  //       const rows = await parseCsvString(payload.base64);
  //       if (!rows || rows.length === 0) {
  //         setCsvHeader(null);
  //         setCsvRows([]);
  //         setCsvPath(payload.path || null);
  //         setSelectedRowIdx(null);
  //         return;
  //       }

  //       const [header, ...data] = rows;
  //       setCsvHeader(header ?? null);
  //       setCsvRows(data);
  //       setCsvPath(payload.path || null);
  //       setSelectedRowIdx(null);
  //     } catch (error) {
  //       console.error(
  //         "Failed to parse CSV",
  //         JSON.stringify({ error: String(error) }),
  //       );
  //     }
  //   },
  //   [setCsvHeader, setCsvRows, setCsvPath, setSelectedRowIdx],
  // );

  // const handleAttachmentsLoad = useCallback(
  //   (
  //     payload: Extract<
  //       VscMessageAttachment,
  //       { type: "attachment-ext-content" }
  //     >["payload"],
  //   ) => {
  //     if (payload.status === "error") {
  //       console.error("Attachments load error", payload.error);
  //       return;
  //     }

  //     const items = Array.isArray(payload.items) ? payload.items : [];
  //     const attachments: AttachmentInput[] = items.map((item) => ({
  //       path: item.path,
  //       name: item.name,
  //       mime: item.mime,
  //       base64: item.base64,
  //     }));

  //     const targetKey =
  //       attachmentTargetKeyRef.current ||
  //       activeModelKey ||
  //       modelConfigs[0]?.key;
  //     if (!targetKey) return;

  //     updateModelConfig(targetKey, (config) => ({
  //       ...config,
  //       attachments,
  //     }));
  //     attachmentTargetKeyRef.current = null;
  //   },
  //   [activeModelKey, modelConfigs, updateModelConfig],
  // );

  // useListen(
  //   "dataset-ext-csv-content",
  //   (message) => {
  //     void handleDatasetLoad(message.payload);
  //   },
  //   [handleDatasetLoad],
  // );

  // useListen(
  //   "attachment-ext-content",
  //   (message) => {
  //     handleAttachmentsLoad(message.payload);
  //   },
  //   [handleAttachmentsLoad],
  // );

  // const requestAttachments = useCallback(
  //   (config: ModelConfig | null) => {
  //     if (!config) return;
  //     const caps = getModelCapabilities(config);
  //     attachmentTargetKeyRef.current = config.key;
  //     send({
  //       type: "attachment-wv-request",
  //       payload: { imagesOnly: caps.supportsImages && !caps.supportsFiles },
  //     });
  //   },
  //   [getModelCapabilities, send],
  // );

  // const clearAttachments = useCallback(
  //   (configKey: string) => {
  //     updateModelConfig(configKey, (config) => ({
  //       ...config,
  //       attachments: [],
  //     }));
  //   },
  //   [updateModelConfig],
  // );

  // const handleAddModel = useCallback(() => {
  //   addConfig();
  // }, [addConfig]);

  // const handleRemoveModel = useCallback(
  //   (key: string) => {
  //     removeConfig(key);
  //   },
  //   [removeConfig],
  // );

  // const handleProviderChange = useCallback(
  //   (configKey: string, providerId: string | null) => {
  //     changeModelProvider(configKey, providerId);
  //   },
  //   [changeModelProvider],
  // );

  // const handleModelChange = useCallback(
  //   (configKey: string, modelId: string | null) => {
  //     changeModelSelection(configKey, modelId);
  //   },
  //   [changeModelSelection],
  // );

  // useEffect(() => {
  //   if (!promptId || !promptMeta) return;
  //   const stored = loadPromptState(promptMeta);
  //   persistedStateRef.current = stored;

  //   if (stored?.data) {
  //     const data = stored.data;
  //     const nextConfigs = (data.modelConfigs ?? []) as ModelConfig[];
  //     replaceAllConfigs(nextConfigs);
  //     setExpandedKey((current) =>
  //       current && nextConfigs.some((cfg) => cfg.key === current)
  //         ? current
  //         : null,
  //     );
  //     replaceAllErrors({});
  //     setVariablesState(data.variables ?? {});
  //     if (data.csv) {
  //       setCsvPath(data.csv.path || null);
  //       setCsvHeader(data.csv.header || null);
  //       setCsvRows(data.csv.rows || []);
  //       setSelectedRowIdx(
  //         typeof data.csv.selectedRowIdx === "number"
  //           ? data.csv.selectedRowIdx
  //           : null,
  //       );
  //     } else {
  //       setCsvPath(null);
  //       setCsvHeader(null);
  //       setCsvRows([]);
  //       setSelectedRowIdx(null);
  //     }
  //     setInputSource(data.inputSource ?? "manual");
  //     setDatasetMode(data.datasetMode ?? "row");
  //     setRangeStart(data.range?.start ?? "");
  //     setRangeEnd(data.range?.end ?? "");
  //     if (data.execution)
  //       // @ts-expect-error -- TODO
  //       setExecutionState({
  //         isLoading: false,
  //         results: Array.isArray(data.execution.results)
  //           ? // @ts-expect-error -- TODO
  //             (data.execution.results as RunResult[])
  //           : [],
  //         error: data.execution.error ?? null,
  //         timestamp: data.execution.timestamp,
  //       });
  //     else setExecutionState({ isLoading: false, results: [], error: null });
  //     setResultsLayout(data.layout ?? "vertical");
  //     setActiveResultIndex(data.activeResultIndex ?? 0);
  //     setCollapsedResults(toNumberBooleanRecord(data.collapsedResults));
  //     setCollapsedModelSettings(
  //       toNumberBooleanRecord(data.collapsedModelSettings),
  //     );
  //     setExpandedRequest(toNumberBooleanRecord(data.requestExpanded));
  //     setExpandedResponse(toNumberBooleanRecord(data.responseExpanded));
  //     setViewTabs(toNumberViewTabs(data.viewTabs));
  //     setStreamingEnabled(
  //       typeof data.streamingEnabled === "boolean"
  //         ? data.streamingEnabled
  //         : true,
  //     );
  //   } else {
  //     const nextVariables: Record<string, string> = {};
  //     prompt?.vars?.forEach((variable) => {
  //       nextVariables[variable.exp] = "";
  //     });
  //     replaceAllConfigs([]);
  //     setExpandedKey(null);
  //     replaceAllErrors({});
  //     setVariablesState(nextVariables);
  //     setCsvPath(null);
  //     setCsvHeader(null);
  //     setCsvRows([]);
  //     setSelectedRowIdx(null);
  //     setExecutionState({ isLoading: false, results: [], error: null });
  //     setInputSource("manual");
  //     setDatasetMode("row");
  //     setRangeStart("");
  //     setRangeEnd("");
  //     setResultsLayout("vertical");
  //     setActiveResultIndex(0);
  //     setCollapsedResults({});
  //     setCollapsedModelSettings({});
  //     setExpandedRequest({});
  //     setExpandedResponse({});
  //     setViewTabs({});
  //     setStreamingEnabled(true);
  //   }
  //   setIsHydrated(true);
  // }, [
  //   promptId,
  //   promptMeta,
  //   prompt,
  //   replaceAllConfigs,
  //   setExpandedKey,
  //   replaceAllErrors,
  //   setVariablesState,
  //   setCsvPath,
  //   setCsvHeader,
  //   setCsvRows,
  //   setSelectedRowIdx,
  //   setInputSource,
  //   setDatasetMode,
  //   setRangeStart,
  //   setRangeEnd,
  //   setExecutionState,
  //   setResultsLayout,
  //   setActiveResultIndex,
  //   setCollapsedResults,
  //   setCollapsedModelSettings,
  //   setExpandedRequest,
  //   setExpandedResponse,
  //   setViewTabs,
  //   setStreamingEnabled,
  // ]);

  // useEffect(() => {
  //   if (!promptMeta || !isHydrated) return;

  //   const snapshot: PlaygroundState = {
  //     // @ts-expect-error -- TODO
  //     modelConfigs,
  //     variables,
  //     csv:
  //       csvHeader || csvRows.length || csvPath
  //         ? {
  //             path: csvPath,
  //             header: csvHeader,
  //             rows: csvRows,
  //             selectedRowIdx,
  //           }
  //         : undefined,
  //     inputSource,
  //     datasetMode,
  //     range: { start: rangeStart, end: rangeEnd },
  //     // @ts-expect-error -- TODO
  //     execution:
  //       executionState.results.length || executionState.error
  //         ? {
  //             results: executionState.results,
  //             error: executionState.error,
  //             timestamp: executionState.timestamp,
  //           }
  //         : undefined,
  //     layout: resultsLayout,
  //     activeResultIndex,
  //     collapsedResults: { ...collapsedResults },
  //     collapsedModelSettings: { ...collapsedModelSettings },
  //     requestExpanded: { ...expandedRequest },
  //     responseExpanded: { ...expandedResponse },
  //     viewTabs: { ...viewTabs },
  //     streamingEnabled,
  //   };

  //   persistedStateRef.current = savePromptState(promptMeta, snapshot);
  // }, [
  //   promptMeta,
  //   isHydrated,
  //   modelConfigs,
  //   variables,
  //   csvPath,
  //   csvHeader,
  //   csvRows,
  //   selectedRowIdx,
  //   inputSource,
  //   datasetMode,
  //   rangeStart,
  //   rangeEnd,
  //   executionState,
  //   resultsLayout,
  //   activeResultIndex,
  //   collapsedResults,
  //   collapsedModelSettings,
  //   expandedRequest,
  //   expandedResponse,
  //   viewTabs,
  //   streamingEnabled,
  // ]);

  // useEffect(() => {
  //   if (!isHydrated) return;
  //   if (modelsLoading) return;
  //   if (modelConfigs.length > 0) return;
  //   if (models.length === 0) return;
  //   addConfig(models[0]?.id ?? null);
  // }, [isHydrated, modelsLoading, modelConfigs.length, models, addConfig]);

  // useEffect(() => {
  //   if (!isHydrated) return;
  //   if (models.length === 0) return;
  //   let hasChange = false;
  //   const next = modelConfigs.map((config) => {
  //     if (!config.modelId) return config;
  //     const entry = models.find((model) => model.id === config.modelId);
  //     if (!entry) return config;
  //     const providerId = normaliseProviderId(providerFromEntry(entry));
  //     const label = entry.name ?? entry.id;
  //     if (config.providerId === providerId && config.label === label)
  //       return config;
  //     hasChange = true;
  //     return {
  //       ...config,
  //       providerId,
  //       label,
  //     };
  //   });
  //   if (hasChange) replaceAllConfigs(next);
  // }, [isHydrated, models, modelConfigs, replaceAllConfigs]);

  // const headersToUse = useMemo(() => {
  //   if (!usingCsv) return null;
  //   return csvHeader!;
  // }, [usingCsv, csvHeader]);

  // const canExecute = () => {
  //   if (!prompt?.vars) return true;
  //   if (inputSource === "manual")
  //     return prompt.vars.every((variable) => variables[variable.exp]?.trim());
  //   if (!usingCsv) return false;
  //   if (datasetMode === "row") return selectedRowIdx !== null;
  //   if (datasetMode === "all") return csvRows.length > 0;
  //   const start = Number(rangeStart);
  //   const end = Number(rangeEnd);
  //   if (
  //     Number.isNaN(start) ||
  //     Number.isNaN(end) ||
  //     start < 1 ||
  //     end < 1 ||
  //     start > end ||
  //     start > csvRows.length ||
  //     end > csvRows.length
  //   )
  //     return false;
  //   return true;
  // };

  // const handleExecute = () => {
  //   if (!prompt || !canExecute()) return;
  //   if (!promptId) return;

  //   const promptText = extractPromptText(fileContent, prompt);
  //   const { runs, runSettings } = buildRunsAndSettings({
  //     inputSource,
  //     datasetMode,
  //     csvRows,
  //     selectedRowIdx,
  //     rangeStart,
  //     rangeEnd,
  //     promptText,
  //     variables,
  //     prompt,
  //     headers: headersToUse,
  //   });

  //   const validationErrors: Record<string, ModelConfigErrors> = {};
  //   const nextErrors: Record<string, ModelConfigErrors> = {
  //     ...modelErrors,
  //   };
  //   const preparedModels: Array<
  //     ModelConfig & {
  //       caps: ReturnType<typeof getModelCapabilities>;
  //       parsedTools: any;
  //       providerOptions: any;
  //       reasoning: ModelConfig["reasoning"];
  //       filteredAttachments: AttachmentInput[];
  //     }
  //   > = [];

  //   for (const config of modelConfigs) {
  //     const errors: ModelConfigErrors = {};
  //     if (!config.providerId) errors.provider = "Select provider";
  //     if (!config.modelId) errors.model = "Select model";

  //     let parsedTools: any = null;
  //     if (config.toolsJson.trim())
  //       try {
  //         parsedTools = JSON.parse(config.toolsJson);
  //       } catch (error) {
  //         errors.tools = "Invalid JSON in tools";
  //       }

  //     let parsedProviderOptions: any = null;
  //     if (config.providerOptionsJson.trim())
  //       try {
  //         parsedProviderOptions = JSON.parse(config.providerOptionsJson);
  //       } catch (error) {
  //         errors.providerOptions = "Invalid JSON in provider options";
  //       }

  //     const caps = getModelCapabilities(config);
  //     const sanitizedReasoning =
  //       caps.supportsReasoning && config.reasoning.enabled
  //         ? { ...config.reasoning, enabled: true }
  //         : { ...config.reasoning, enabled: false };
  //     const mergedProviderOptions = mergeProviderOptionsWithReasoning(
  //       parsedProviderOptions ?? null,
  //       caps,
  //       sanitizedReasoning,
  //     );
  //     const filteredAttachments = filterAttachmentsForCapabilities(
  //       config.attachments,
  //       caps,
  //     );

  //     if (
  //       errors.provider ||
  //       errors.model ||
  //       errors.tools ||
  //       errors.providerOptions
  //     ) {
  //       validationErrors[config.key] = {
  //         ...validationErrors[config.key],
  //         ...errors,
  //       };
  //       nextErrors[config.key] = {
  //         ...nextErrors[config.key],
  //         ...errors,
  //       };
  //       continue;
  //     }

  //     preparedModels.push({
  //       ...config,
  //       caps,
  //       parsedTools,
  //       providerOptions: mergedProviderOptions,
  //       reasoning: sanitizedReasoning,
  //       // @ts-expect-error -- TODO
  //       filteredAttachments,
  //     });
  //   }

  //   for (const model of preparedModels)
  //     nextErrors[model.key] = {
  //       provider: null,
  //       model: null,
  //       tools: null,
  //       providerOptions: null,
  //     };

  //   replaceAllErrors(nextErrors);

  //   if (
  //     Object.keys(validationErrors).length > 0 ||
  //     preparedModels.length === 0
  //   ) {
  //     if (preparedModels.length === 0)
  //       setExecutionState({
  //         isLoading: false,
  //         results: [],
  //         error: "Configure at least one valid model before running",
  //       });
  //     return;
  //   }

  //   setExecutionState({ isLoading: true, results: [], error: null });
  //   setIsStopping(false);
  //   setCollapsedResults({});
  //   setCollapsedModelSettings({});
  //   setExpandedRequest({});
  //   setExpandedResponse({});

  //   const payload = {
  //     promptId,
  //     promptText,
  //     variables,
  //     runs,
  //     runSettings: {
  //       ...runSettings,
  //       streaming: { enabled: streamingEnabled },
  //     },
  //     streamingEnabled,
  //     models: preparedModels.map((model) => ({
  //       key: model.key,
  //       modelId: model.modelId,
  //       providerId: model.providerId,
  //       label: model.label ?? model.modelId,
  //       options: model.generationOptions as unknown as Record<string, unknown>,
  //       tools: model.caps.supportsTools ? (model.parsedTools ?? null) : null,
  //       providerOptions: model.providerOptions ?? null,
  //       reasoning: model.reasoning,
  //       attachments: model.filteredAttachments.map(
  //         ({ name, mime, base64 }) => ({
  //           name: name ?? "",
  //           mime: mime ?? "application/octet-stream",
  //           base64: base64 ?? "",
  //         }),
  //       ),
  //     })),
  //   };

  //   send({ type: "prompt-run-wv-execute", payload });
  // };

  // const handleExecuteRef = useRef<() => void>(() => {});
  // handleExecuteRef.current = handleExecute;

  // useListen(
  //   "prompts-ext-execute-from-command",
  //   () => {
  //     handleExecuteRef.current();
  //   },
  //   [],
  // );

  // const handleClear = () => {
  //   setExecutionState({
  //     isLoading: false,
  //     results: [],
  //     error: null,
  //   });
  //   setStreamingState(createEmptyStreamingState());
  //   setIsStopping(false);
  //   activeRunIdRef.current = null;
  //   setCollapsedResults({});
  //   setCollapsedModelSettings({});
  //   setExpandedRequest({});
  //   setExpandedResponse({});
  //   setViewTabs({});
  // };

  // useEffect(() => {
  //   setActiveResultIndex((idx) => {
  //     if (executionState.results.length === 0) return 0;
  //     return Math.min(idx, executionState.results.length - 1);
  //   });
  // }, [executionState.results.length, setActiveResultIndex]);

  // const activeRunId = streamingState.runId;
  // const runInFlight =
  //   Boolean(activeRunId) || executionState.isLoading || isStopping;
  // const showStopButton = runInFlight;
  // const stopDisabled = isStopping || !activeRunId;
  // const canRunPrompt = canExecute();

  // const datasourceContextValue = useMemo(
  //   () => ({
  //     promptVariables,
  //     inputSource,
  //     setInputSource,
  //     datasetMode,
  //     setDatasetMode,
  //     variables,
  //     setVariables: setVariablesState,
  //     csvPath,
  //     setCsvPath,
  //     csvHeader,
  //     setCsvHeader,
  //     csvRows,
  //     setCsvRows,
  //     selectedRowIdx,
  //     setSelectedRowIdx,
  //     rangeStart,
  //     setRangeStart,
  //     rangeEnd,
  //     setRangeEnd,
  //     handleVariableChange,
  //     handleSelectRow,
  //     handleLoadCsv,
  //     handleClearCsv,
  //     usingCsv,
  //     csvFileLabel,
  //   }),
  //   [
  //     promptVariables,
  //     inputSource,
  //     setInputSource,
  //     datasetMode,
  //     setDatasetMode,
  //     variables,
  //     setVariablesState,
  //     csvPath,
  //     setCsvPath,
  //     csvHeader,
  //     setCsvHeader,
  //     csvRows,
  //     setCsvRows,
  //     selectedRowIdx,
  //     setSelectedRowIdx,
  //     rangeStart,
  //     setRangeStart,
  //     rangeEnd,
  //     setRangeEnd,
  //     handleVariableChange,
  //     handleSelectRow,
  //     handleLoadCsv,
  //     handleClearCsv,
  //     usingCsv,
  //     csvFileLabel,
  //   ],
  // );

  // const resultsContextValue = useMemo(() => {
  //   const contextTimestamp = executionState.timestamp;

  //   const value: ResultsContextValue = {
  //     results: executionState.results,
  //     models,
  //     layout: resultsLayout,
  //     onLayoutChange: setResultsLayout,
  //     collapsedResults,
  //     onToggleCollapse: (index: number) =>
  //       setCollapsedResults((prev) => ({
  //         ...prev,
  //         [index]: !(prev[index] ?? false),
  //       })),
  //     collapsedModelSettings,
  //     onToggleModelSettings: (index: number) =>
  //       setCollapsedModelSettings((prev) => ({
  //         ...prev,
  //         [index]: !(prev[index] ?? true),
  //       })),
  //     requestExpanded: expandedRequest,
  //     onToggleRequest: (index: number) =>
  //       setExpandedRequest((prev) => ({
  //         ...prev,
  //         [index]: !prev[index],
  //       })),
  //     responseExpanded: expandedResponse,
  //     onToggleResponse: (index: number) =>
  //       setExpandedResponse((prev) => ({
  //         ...prev,
  //         [index]: !prev[index],
  //       })),
  //     viewTabs,
  //     onChangeView: (index: number, view: "rendered" | "raw") =>
  //       setViewTabs((prev) => ({
  //         ...prev,
  //         [index]: view,
  //       })),
  //     activeResultIndex,
  //     onActiveResultIndexChange: (index: number) =>
  //       setActiveResultIndex((prev) => {
  //         if (executionState.results.length === 0) return 0;
  //         const maxIndex = executionState.results.length - 1;
  //         const next = Math.max(0, Math.min(index, maxIndex));
  //         return next;
  //       }),
  //   };

  //   if (contextTimestamp !== undefined) value.timestamp = contextTimestamp;

  //   return value;
  // }, [
  //   executionState.results,
  //   executionState.timestamp,
  //   models,
  //   resultsLayout,
  //   setResultsLayout,
  //   collapsedResults,
  //   setCollapsedResults,
  //   collapsedModelSettings,
  //   setCollapsedModelSettings,
  //   expandedRequest,
  //   setExpandedRequest,
  //   expandedResponse,
  //   setExpandedResponse,
  //   viewTabs,
  //   setViewTabs,
  //   activeResultIndex,
  //   setActiveResultIndex,
  // ]);

  // const { gateway, dotdev } = useModels();
  // const modelsLoading = !gateway.response && !dotdev.response;

  //#endregion

  const { prompt } = props;

  return (
    <div className="flex flex-col gap-2">
      <ModelSetups
      // configs={modelConfigs}
      // errors={modelErrors}
      // expandedKey={expandedModelKey}
      // providerOptions={providerOptions}
      // getModelOptions={getModelsForProvider}
      // getCapabilities={getModelCapabilities}
      // onAddModel={handleAddModel}
      // onRemoveModel={handleRemoveModel}
      // onToggleExpand={setExpandedKey}
      // onProviderChange={handleProviderChange}
      // onModelChange={handleModelChange}
      // onGenerationOptionChange={updateGenerationOption}
      // onReasoningChange={updateReasoning}
      // onToolsJsonChange={updateToolsJson}
      // onProviderOptionsJsonChange={updateProviderOptionsJson}
      // onRequestAttachments={(key) =>
      //   requestAttachments(
      //     modelConfigs.find((config) => config.key === key) ?? null,
      //   )
      // }
      // onClearAttachments={clearAttachments}
      // addDisabled={modelsLoading}
      />

      {/* <AssessmentDatasourceProvider value={datasourceContextValue}>
        <DatasourceSelector />
      </AssessmentDatasourceProvider> */}

      {/* <AssessmentRun
        canRunPrompt={canRunPrompt}
        runInFlight={runInFlight}
        isStopping={isStopping}
        showStopButton={showStopButton}
        stopDisabled={stopDisabled}
        streamingEnabled={streamingEnabled}
        streamingToggleId={streamingToggleId}
        hasResultsOrError={
          executionState.results.length > 0 || executionState.error !== null
        }
        onExecute={handleExecute}
        onStop={handleStop}
        onClear={handleClear}
        onStreamingToggle={setStreamingEnabled}
      /> */}

      {/* <AssessmentResultsProvider value={resultsContextValue}> */}
      <Results />
      {/* </AssessmentResultsProvider> */}

      {/* {executionState.error && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Error</h5>
          <div className="p-3 rounded border">
            <pre className="text-sm whitespace-pre-wrap">
              {executionState.error}
            </pre>
          </div>
        </div>
      )} */}
    </div>
  );
}
