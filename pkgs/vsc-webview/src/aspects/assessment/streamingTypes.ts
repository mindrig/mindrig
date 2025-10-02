import type {
  PromptRunCompletedPayload,
  PromptRunErrorPayload,
  PromptRunMessage,
  PromptRunResultData,
  PromptRunResultShell,
  PromptRunStartedPayload,
  PromptRunUpdatePayload,
  PromptRunUpdateDelta,
  PromptRunResultCompletedPayload,
} from "@wrkspc/vsc-types";

export type StreamingMessage = PromptRunMessage;
export type StreamingRunStarted = PromptRunStartedPayload;
export type StreamingRunCompleted = PromptRunCompletedPayload;
export type StreamingRunError = PromptRunErrorPayload;
export type StreamingRunUpdate = PromptRunUpdatePayload;
export type StreamingRunDelta = PromptRunUpdateDelta;
export type StreamingResultShell = PromptRunResultShell;
export type StreamingResultData = PromptRunResultData;
export type StreamingRunResultCompleted = PromptRunResultCompletedPayload;

export interface AssessmentStreamingResult {
  id: string;
  label: string;
  runLabel: string;
  model: StreamingResultShell["model"];
  streaming: boolean;
  textParts: string[];
  fullText: string | null;
  success: boolean | null;
  error: string | null;
  loading: boolean;
  nonStreamingNote?: string | null;
  metadata?: Partial<
    Pick<
      StreamingResultData,
      | "usage"
      | "totalUsage"
      | "steps"
      | "finishReason"
      | "warnings"
      | "request"
      | "response"
    >
  >;
}

export interface AssessmentStreamingState {
  runId: string | null;
  promptId: string | null;
  streaming: boolean;
  startedAt: number | null;
  completedAt: number | null;
  results: Record<string, AssessmentStreamingResult>;
  order: string[];
  error?: string | null;
}

export const emptyStreamingState: AssessmentStreamingState = {
  runId: null,
  promptId: null,
  streaming: true,
  startedAt: null,
  completedAt: null,
  results: {},
  order: [],
  error: null,
};

export const createEmptyStreamingState = (): AssessmentStreamingState => ({
  runId: null,
  promptId: null,
  streaming: true,
  startedAt: null,
  completedAt: null,
  results: {},
  order: [],
  error: null,
});

export interface StreamingUpdateContext {
  state: AssessmentStreamingState;
  payload: StreamingRunUpdate;
}

export function appendTextChunk(
  result: AssessmentStreamingResult,
  chunk: string,
) {
  if (chunk.length === 0) return result;
  const parts = result.textParts.concat(chunk);
  return {
    ...result,
    textParts: parts,
    fullText: (result.fullText ?? "") + chunk,
  };
}
