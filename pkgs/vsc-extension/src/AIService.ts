import { createGateway } from "@ai-sdk/gateway";
import { VscController } from "@wrkspc/vsc-controller";
import {
  streamText,
  type LanguageModelRequestMetadata,
  type LanguageModelResponseMetadata,
  type LanguageModelUsage,
  type StreamTextOnChunkCallback,
  type StreamTextOnFinishCallback,
  type ToolSet,
} from "ai";

type LlmRequest = LanguageModelRequestMetadata;

type LlmResponse = LanguageModelResponseMetadata & {
  body?: unknown;
};

type StreamChunk = Parameters<StreamTextOnChunkCallback<ToolSet>>[0]["chunk"];
type StreamFinishEvent = Parameters<StreamTextOnFinishCallback<ToolSet>>[0];
type OptionalLanguageModelUsage = LanguageModelUsage | undefined;

export interface PromptStreamingHandlers {
  onChunk?: (chunk: StreamChunk) => void | Promise<void>;
  onTextDelta?: (delta: string, chunk: StreamChunk) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
}

export interface ExecutePromptRuntimeOptions {
  signal?: AbortSignal;
  streamingHandlers?: PromptStreamingHandlers;
}

interface PromptRunSummary {
  text: string | null;
  usage?: OptionalLanguageModelUsage;
  totalUsage?: OptionalLanguageModelUsage;
  request: LlmRequest;
  response: LlmResponse;
  steps: StreamFinishEvent["steps"];
  finishReason?: StreamFinishEvent["finishReason"] | null;
  warnings?: StreamFinishEvent["warnings"];
}

export class AIService extends VscController {
  #apiKey: string | null = null;

  constructor(apiKey?: string) {
    super();
    this.#apiKey = apiKey || null;
  }

  setApiKey(apiKey: string) {
    this.#apiKey = apiKey;
  }

  dispose() {
    this.#apiKey = null;
  }

  hasApiKey(): boolean {
    return this.#apiKey !== null;
  }

  async executePrompt(
    promptText: string,
    modelId?: string,
    options?: {
      maxOutputTokens?: number;
      temperature?: number;
      topP?: number;
      topK?: number;
      presencePenalty?: number;
      frequencyPenalty?: number;
      stopSequences?: string[];
      seed?: number;
    },
    extras?: {
      tools?: Record<string, any> | null;
      toolChoice?: any;
      providerOptions?: Record<string, any> | null;
    },
    attachments?: Array<{ name: string; mime: string; dataBase64: string }>,
    runtimeOptions?: ExecutePromptRuntimeOptions,
  ): Promise<
    | {
        success: true;
        request: LlmRequest;
        response: LlmResponse;
        usage?: OptionalLanguageModelUsage;
        totalUsage?: OptionalLanguageModelUsage;
        text?: string | null;
        steps?: StreamFinishEvent["steps"];
        finishReason?: StreamFinishEvent["finishReason"] | null;
        warnings?: StreamFinishEvent["warnings"];
      }
    | { success: false; error: string }
  > {
    if (!this.#apiKey)
      return {
        success: false,
        error:
          "No Vercel Gateway API key configured. Please set your API key first.",
      };

    try {
      const gateway = createGateway({ apiKey: this.#apiKey });

      const hasAttachments =
        Array.isArray(attachments) && attachments.length > 0;

      const streamArgs: any = {
        model: gateway((modelId || "openai/gpt-5-mini") as any),
        maxOutputTokens: options?.maxOutputTokens,
        temperature: options?.temperature,
        topP: options?.topP,
        topK: options?.topK,
        presencePenalty: options?.presencePenalty,
        frequencyPenalty: options?.frequencyPenalty,
        stopSequences: options?.stopSequences,
        seed: options?.seed,
        tools: extras?.tools ?? undefined,
        toolChoice: extras?.toolChoice ?? undefined,
        providerOptions: extras?.providerOptions ?? undefined,
      };

      if (hasAttachments) {
        const parts: any[] = [{ type: "text", text: promptText }];
        for (const att of attachments!) {
          const buf = Buffer.from(att.dataBase64, "base64");
          const mime = att.mime || "application/octet-stream";

          if (mime.startsWith("image/")) {
            parts.push({ type: "image", image: buf, mediaType: mime });
            continue;
          }

          let isTextLike =
            mime.startsWith("text/") ||
            [
              "application/json",
              "application/javascript",
              "application/typescript",
              "application/xml",
              "application/yaml",
              "application/x-yaml",
            ].includes(mime);

          if (!isTextLike) {
            const lower = att.name.toLowerCase();
            const textExts = [
              ".txt",
              ".md",
              ".json",
              ".js",
              ".ts",
              ".tsx",
              ".jsx",
              ".css",
              ".html",
              ".xml",
              ".yml",
              ".yaml",
              ".toml",
              ".ini",
              ".env",
            ];
            isTextLike = textExts.some((ext) => lower.endsWith(ext));
          }

          if (isTextLike) {
            let text: string;
            try {
              text = buf.toString("utf8");
            } catch {
              text = "[Could not decode file as UTF-8]";
            }
            parts.push({
              type: "text",
              text: `Attached file: ${att.name} (${mime})\n\n${text}`,
            });
          } else {
            parts.push({
              type: "text",
              text: `Attached file omitted (binary): ${att.name} (${mime})`,
            });
          }
        }
        streamArgs.messages = [
          {
            role: "user",
            content: parts,
          },
        ];
      } else {
        streamArgs.prompt = promptText;
      }

      const handlers = runtimeOptions?.streamingHandlers;
      const onChunkHandler = handlers?.onChunk;
      const onTextDeltaHandler = handlers?.onTextDelta;
      const onStreamingError = handlers?.onError;
      let collectedText = "";
      let summary: PromptRunSummary | null = null;

      const stream = streamText({
        ...streamArgs,
        abortSignal: runtimeOptions?.signal,
        onChunk:
          onChunkHandler || onTextDeltaHandler
            ? async ({ chunk }: { chunk: StreamChunk }) => {
                if (onChunkHandler) await onChunkHandler(chunk);
                if (chunk.type === "text-delta") {
                  collectedText += chunk.text ?? "";
                  if (onTextDeltaHandler)
                    await onTextDeltaHandler(chunk.text ?? "", chunk);
                }
              }
            : undefined,
        onError: onStreamingError
          ? async ({ error }) => {
              await onStreamingError!(error);
            }
          : undefined,
        onFinish: async (event: StreamFinishEvent) => {
          const { messages: _ignoredMessages, ...responseWithoutMessages } =
            event.response as any;
          collectedText =
            typeof event.text === "string" ? event.text : collectedText;
          summary = {
            text:
              typeof event.text === "string"
                ? event.text
                : collectedText.length > 0
                  ? collectedText
                  : null,
            usage: event.usage,
            totalUsage: event.totalUsage,
            request: event.request as LlmRequest,
            response: responseWithoutMessages as LlmResponse,
            steps: event.steps,
            finishReason: event.finishReason,
          };
          if (event.warnings !== undefined) summary.warnings = event.warnings;
        },
      });

      await stream.consumeStream();

      if (!summary) {
        summary = await (async (): Promise<PromptRunSummary> => {
          const [request, response, usage, totalUsage, text] =
            await Promise.all([
              stream.request.catch(() => null),
              stream.response.catch(() => null),
              stream.usage.catch(() => null),
              stream.totalUsage.catch(() => null),
              stream.text.catch(() => null),
            ]);

          let responseWithoutMessages: LlmResponse =
            (response as LlmResponse) ?? ({} as LlmResponse);
          if (
            response &&
            typeof response === "object" &&
            "messages" in (response as any)
          ) {
            const { messages: _ignored, ...rest } = response as Record<
              string,
              unknown
            >;
            responseWithoutMessages = rest as LlmResponse;
          }

          const fallbackSummary: PromptRunSummary = {
            text:
              typeof text === "string"
                ? text
                : collectedText.length > 0
                  ? collectedText
                  : null,
            usage: (usage as LanguageModelUsage) ?? undefined,
            totalUsage:
              (totalUsage as LanguageModelUsage) ??
              (usage as LanguageModelUsage) ??
              undefined,
            request: (request as LlmRequest) ?? ({} as LlmRequest),
            response: responseWithoutMessages,
            steps: [],
          };

          return fallbackSummary;
        })();
      }

      const normalizedText =
        typeof summary.text === "string"
          ? summary.text
          : collectedText.length > 0
            ? collectedText
            : null;

      return {
        success: true,
        request: summary.request,
        response: summary.response,
        usage: summary.usage,
        totalUsage: summary.totalUsage,
        ...(typeof normalizedText === "string" ? { text: normalizedText } : {}),
        steps: summary.steps,
        ...(summary.finishReason !== undefined
          ? { finishReason: summary.finishReason }
          : {}),
        ...(summary.warnings !== undefined
          ? { warnings: summary.warnings }
          : {}),
      };
    } catch (error) {
      console.error("AI Service error:", error);

      const onError = runtimeOptions?.streamingHandlers?.onError;
      if (onError) await onError(error);

      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;

        if (
          errorMessage.includes("network socket disconnected") ||
          errorMessage.includes("TLS connection")
        )
          errorMessage =
            "Network connectivity issue. Please check your internet connection and try again.";
        else if (
          errorMessage.includes("401") ||
          errorMessage.includes("unauthorized")
        )
          errorMessage =
            "Invalid API key. Please verify your Vercel Gateway API key is correct.";
        else if (errorMessage.includes("429"))
          errorMessage =
            "Rate limit exceeded. Please wait a moment and try again.";
        else if (
          errorMessage.includes("500") ||
          errorMessage.includes("502") ||
          errorMessage.includes("503")
        )
          errorMessage =
            "Server error. The Vercel Gateway service may be temporarily unavailable.";
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      if ((error as any)?.name === "AbortError")
        errorMessage = "Prompt run cancelled.";

      return {
        success: false,
        error: `Failed to execute prompt: ${errorMessage}`,
      };
    }
  }
}
