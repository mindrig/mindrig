import { createGateway } from "@ai-sdk/gateway";
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

export class AIService {
  #apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.#apiKey = apiKey || null;
  }

  setApiKey(apiKey: string) {
    this.#apiKey = apiKey;
  }

  clearApiKey() {
    this.#apiKey = null;
  }

  hasApiKey(): boolean {
    return this.#apiKey !== null;
  }

  async executePrompt(
    promptText: string
  ): Promise<
    | { success: true; request: LlmRequest; response: LlmResponse }
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

      const {
        request,
        response: { messages, ...response },
      } = await generateText({
        model: gateway("openai/gpt-5-mini"),
        prompt: promptText,
      });

      return {
        success: true,
        request,
        response,
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
        ) {
          errorMessage =
            "Network connectivity issue. Please check your internet connection and try again.";
        } else if (
          errorMessage.includes("401") ||
          errorMessage.includes("unauthorized")
        ) {
          errorMessage =
            "Invalid API key. Please verify your Vercel Gateway API key is correct.";
        } else if (errorMessage.includes("429")) {
          errorMessage =
            "Rate limit exceeded. Please wait a moment and try again.";
        } else if (
          errorMessage.includes("500") ||
          errorMessage.includes("502") ||
          errorMessage.includes("503")
        ) {
          errorMessage =
            "Server error. The Vercel Gateway service may be temporarily unavailable.";
        }
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      return {
        success: false,
        error: `Failed to execute prompt: ${errorMessage}`,
      };
    }
  }
}
