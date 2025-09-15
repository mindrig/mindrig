import type { DatasetMode } from "@wrkspc/dataset";
import type { ModelDotdev } from "./dotdev";

export interface GenerationOptionsInput {
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string; // comma-separated from UI
  seed?: number;
}

export interface GenerationOptionsNormalized {
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  seed?: number;
}

export function normalizeGenerationOptions(
  input: GenerationOptionsInput | undefined,
): GenerationOptionsNormalized | undefined {
  if (!input) return undefined;
  const { stopSequences, ...rest } = input;
  const out: any = { ...rest };
  if (stopSequences && stopSequences.trim().length > 0) {
    out.stopSequences = stopSequences
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return out as GenerationOptionsNormalized;
}

export interface AttachmentInput {
  path: string;
  name: string;
  mime?: string;
  dataBase64?: string;
}

export interface AttachmentOut {
  name: string;
  mime: string;
  dataBase64: string;
}

export function filterAttachmentsForCapabilities(
  attachments: AttachmentInput[],
  caps: ModelDotdev.Capabilities,
): AttachmentOut[] {
  if (!attachments?.length) return [];
  if (caps.supportsFiles)
    return attachments.map((a) => ({
      name: a.name,
      mime: a.mime || "application/octet-stream",
      dataBase64: a.dataBase64 || "",
    }));
  if (caps.supportsImages)
    return attachments
      .filter((a) => (a.mime || "").startsWith("image/"))
      .map((a) => ({
        name: a.name,
        mime: a.mime || "application/octet-stream",
        dataBase64: a.dataBase64 || "",
      }));
  return [];
}

export function mergeProviderOptionsWithReasoning(
  providerOptions: any | null | undefined,
  caps: ModelDotdev.Capabilities,
  reasoning: {
    enabled: boolean;
    effort: "low" | "medium" | "high";
    budgetTokens?: number | "";
  },
) {
  const merged = { ...(providerOptions ?? {}) } as any;
  if (caps.supportsReasoning && reasoning.enabled) {
    (merged as any).reasoning = {
      effort: reasoning.effort,
      ...(reasoning.budgetTokens !== "" && reasoning.budgetTokens !== undefined
        ? { budgetTokens: Number(reasoning.budgetTokens) }
        : {}),
    };
  }
  return merged;
}

export function buildExecutePayload(args: {
  promptText: string;
  substitutedPrompt: string;
  variables: Record<string, string>;
  promptId: string;
  modelId?: string | null;
  options?: GenerationOptionsInput;
  tools?: any | null;
  toolChoice?: any;
  providerOptions?: any | null;
  attachments?: AttachmentInput[];
  caps: ModelDotdev.Capabilities;
  runSettings: {
    source: "manual" | "dataset";
    datasetMode: DatasetMode;
    selectedRowIdx: number | null;
    range?: { start: number; end: number };
    totalRows: number;
  };
  runs: Array<{
    label: string;
    variables: Record<string, string>;
    substitutedPrompt: string;
  }>;
  reasoning: {
    enabled: boolean;
    effort: "low" | "medium" | "high";
    budgetTokens?: number | "";
  };
}): any {
  const payload: any = {
    promptText: args.promptText,
    substitutedPrompt: args.substitutedPrompt,
    variables: args.variables,
    promptId: args.promptId,
    runSettings: args.runSettings,
    runs: args.runs,
  };

  if (args.modelId) payload.modelId = args.modelId;
  if (args.tools !== undefined) payload.tools = args.tools ?? null;
  if (args.toolChoice !== undefined) payload.toolChoice = args.toolChoice;
  payload.providerOptions = mergeProviderOptionsWithReasoning(
    args.providerOptions ?? null,
    args.caps,
    args.reasoning,
  );
  payload.attachments = filterAttachmentsForCapabilities(
    args.attachments ?? [],
    args.caps,
  );
  const norm = normalizeGenerationOptions(args.options);
  if (norm) payload.options = norm;

  return payload;
}
