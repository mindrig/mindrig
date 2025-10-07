export * from "./promptRun.js";

export interface PromptRunAttachmentMeta {
  name: string;
  mime?: string;
  base64?: string;
}

export interface PromptRunModelSettings {
  options?: unknown;
  reasoning?: {
    enabled: boolean;
    effort: "low" | "medium" | "high";
    budgetTokens?: number | "";
  };
  providerOptions?: unknown;
  tools?: unknown;
  attachments?: PromptRunAttachmentMeta[];
}

export interface PromptRunModelInfo {
  key: string;
  id: string | null;
  providerId: string | null;
  label?: string | null;
  settings: PromptRunModelSettings;
}

export interface PromptRunResultData {
  resultId: string;
  success: boolean;
  prompt: string | null;
  text?: string | null;
  label: string;
  runLabel: string;
  request?: unknown;
  response?: unknown;
  usage?: unknown;
  totalUsage?: unknown;
  steps?: unknown;
  finishReason?: string | null;
  warnings?: unknown;
  error?: string | null;
  model: PromptRunModelInfo;
}

export interface PromptRunResultShell {
  resultId: string;
  label: string;
  runLabel: string;
  model: PromptRunModelInfo;
  streaming: boolean;
}

export type PromptRunUpdateDelta =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "tool-input";
      toolCallId: string;
      name: string;
      inputText: string;
    }
  | {
      type: "tool-output";
      toolCallId: string;
      name: string;
      output: unknown;
      isFinal?: boolean;
    }
  | {
      type: "raw";
      raw: unknown;
    };

export interface PromptRunStartedPayload {
  runId: string;
  promptId: string;
  timestamp: number;
  streaming: boolean;
  results: PromptRunResultShell[];
  runSettings?: unknown;
}

export interface PromptRunUpdatePayload {
  runId: string;
  resultId: string;
  timestamp: number;
  promptId: string;
  delta: PromptRunUpdateDelta;
}

export interface PromptRunResultCompletedPayload {
  runId: string;
  promptId: string;
  timestamp: number;
  result: PromptRunResultData;
}
