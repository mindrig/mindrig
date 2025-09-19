import { createGateway } from "@ai-sdk/gateway";
import { VscController } from "@wrkspc/vsc-controller";
import {
  AssistantModelMessage,
  generateText,
  LanguageModelRequestMetadata,
  LanguageModelResponseMetadata,
  UserModelMessage,
} from "ai";

type LlmRequest = LanguageModelRequestMetadata;

type LlmMessage = AssistantModelMessage | UserModelMessage;

type LlmResponse = LanguageModelResponseMetadata & {
  // messages: Array<LlmMessage>;
  body?: unknown;
};

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
  ): Promise<
    | {
        success: true;
        request: LlmRequest;
        response: LlmResponse;
        usage?: any;
        totalUsage?: any;
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

      const genArgs: any = {
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

          // Prefer native image parts for images
          if (mime.startsWith("image/")) {
            parts.push({ type: "image", image: buf, mediaType: mime });
            continue;
          }

          // For non-image attachments, the Vercel AI Gateway does not support
          // generic `file` parts (notably application/octet-stream). To avoid
          // gateway errors, inline text-like files as "text" content and
          // gracefully omit binary files with a short note.
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
        genArgs.messages = [
          {
            role: "user",
            content: parts,
          },
        ];
      } else {
        genArgs.prompt = promptText;
      }

      const {
        text,
        request,
        response: { messages, ...response },
        usage,
        totalUsage,
      } = await generateText(genArgs);

      return {
        success: true,
        request,
        response,
        usage,
        totalUsage,
        // Include assistant text output so webview can render markdown/raw
        // without needing to inspect provider-specific response shapes.
        ...(typeof text === "string" ? { text } : {}),
      };
    } catch (error) {
      console.error("AI Service error:", error);

      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;

        // Provide more specific error messages for common issues
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
      } else {
        if (typeof error === "string") errorMessage = error;
      }

      return {
        success: false,
        error: `Failed to execute prompt: ${errorMessage}`,
      };
    }
  }
}
