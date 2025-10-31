import type {
  PromptRunResultData,
  PromptRunResultShell,
  PromptRunUpdatePayload,
} from "@wrkspc/core/run";

export interface AssessmentStreamingResult {
  id: string;
  label: string;
  runLabel: string;
  model: PromptRunResultShell["model"];
  streaming: boolean;
  textParts: string[];
  fullText: string | null;
  success: boolean | null;
  error: string | null;
  loading: boolean;
  nonStreamingNote?: string | null;
  metadata?: Partial<
    Pick<
      PromptRunResultData,
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
  payload: PromptRunUpdatePayload;
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
