import { Manager } from "@/aspects/manager/Manager.js";
import { createGateway } from "@ai-sdk/gateway";
import { ModelSettings } from "@wrkspc/core/model";
import {
  PromptRunResultData,
  PromptRunResultShell,
  RunMessage,
} from "@wrkspc/core/run";
import {
  streamText,
  type LanguageModelRequestMetadata,
  type LanguageModelResponseMetadata,
  type LanguageModelUsage,
  type StreamTextOnChunkCallback,
  type StreamTextOnFinishCallback,
  type ToolSet,
} from "ai";
import { nanoid } from "nanoid";
import PQueue from "p-queue";
import * as vscode from "vscode";
import { MessagesManager } from "../message/Manager";
import { SecretsManager } from "../secret/Manager";

export namespace RunManager {
  export interface Props {
    messages: MessagesManager;
    secrets: SecretsManager;
  }

  //#region Legacy types

  export interface ExecuteOptions {
    maxOutputTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    stopSequences?: string[];
    seed?: number;
  }

  export interface ExecuteExtras {
    tools?: Record<string, any> | null;
    toolChoice?: any;
    providerOptions?: Record<string, any> | null;
  }

  export interface ExecuteRuntimeOptions {
    signal?: AbortSignal;
    streamingHandlers?: ExecuteStreamingHandlers;
  }

  export interface ExecuteStreamingHandlers {
    onChunk?: (chunk: RunManager.ExecuteStreamChunk) => void | Promise<void>;
    onTextDelta?: (
      delta: string,
      chunk: RunManager.ExecuteStreamChunk,
    ) => void | Promise<void>;
    onError?: (error: unknown) => void | Promise<void>;
  }

  export interface ExecuteSummary {
    text: string | null;
    usage?: LanguageModelUsage | undefined;
    totalUsage?: LanguageModelUsage | undefined;
    request: LanguageModelRequestMetadata;
    response: LanguageModelResponseMetadata;
    steps: RunManager.ExecuteStreamFinishEvent["steps"];
    finishReason?: RunManager.ExecuteStreamFinishEvent["finishReason"] | null;
    warnings?: RunManager.ExecuteStreamFinishEvent["warnings"];
  }

  export type ExecuteStreamChunk = Parameters<
    StreamTextOnChunkCallback<ToolSet>
  >[0]["chunk"];

  export type ExecuteStreamFinishEvent = Parameters<
    StreamTextOnFinishCallback<ToolSet>
  >[0];

  //#endregion
}

export class RunManager extends Manager {
  #messages: MessagesManager;
  #secrets: SecretsManager;

  constructor(parent: Manager, props: RunManager.Props) {
    super(parent);

    this.#messages = props.messages;
    this.#secrets = props.secrets;

    this.#messages.listen(this, "run-client-execute", (message) =>
      this.#handleExecutePrompt(message.payload),
    );

    this.#messages.listen(this, "run-vw-stop", (message) =>
      this.#handleStopPromptRun(message.payload),
    );
  }

  trigger() {
    this.#messages.send({ type: "run-server-trigger" });
  }

  //#region Legacy runtime

  #activeRunControllers: Map<string, Set<AbortController>> = new Map();
  #cancelledRuns: Set<string> = new Set();
  #lastExecutionPayload: RunMessage.ClientExecutePayload | null = null;

  #cloneExecutionPayload(
    payload: RunMessage.ClientExecutePayload,
  ): RunMessage.ClientExecutePayload {
    return JSON.parse(
      JSON.stringify(payload),
    ) as RunMessage.ClientExecutePayload;
  }

  async #handleExecutePrompt(payload: RunMessage.ClientExecutePayload) {
    this.#lastExecutionPayload = this.#cloneExecutionPayload(payload);

    const runId = nanoid();
    const promptId = payload.promptId;
    const now = () => Date.now();

    const sendRunError = (error: string, resultId?: string) => {
      const payload: RunMessage.ServerErrorPayload = {
        runId,
        promptId,
        timestamp: now(),
        error,
      };
      if (typeof resultId === "string") payload.resultId = resultId;
      this.#messages.send({ type: "run-server-error", payload });
    };

    const sendRunUpdate = (resultId: string, delta: string) => {
      const message: RunMessage.ServerUpdate = {
        type: "run-server-update",
        payload: {
          runId,
          promptId,
          resultId,
          timestamp: now(),
          delta: { type: "text", text: delta },
        },
      };
      this.#messages.send(message);
    };

    const apiKey = await this.#secrets.get("auth-vercel-gateway-key");
    if (!apiKey) {
      const error =
        "No Vercel Gateway API key configured. Please set your API key in the panel above.";
      sendRunError(error);
      this.#messages.send({
        type: "run-server-execution-result",
        payload: {
          success: false,
          error,
          promptId,
          timestamp: now(),
          results: [],
          runId,
        },
      });
      return;
    }

    const streamingEnabled = !!payload.streamingEnabled;

    this.#lastExecutionPayload = this.#cloneExecutionPayload(payload);

    try {
      const runs =
        Array.isArray(payload.runs) && payload.runs.length
          ? payload.runs
          : [
              {
                label: "Run 1",
                variables: payload.variables || {},
                substitutedPrompt: payload.promptText,
              },
            ];

      const models =
        Array.isArray(payload.models) && payload.models.length
          ? payload.models
          : [
              {
                key: "default",
                modelId: payload.modelId ?? null,
                providerId: null,
                label: payload.modelId ?? "Default model",
                options: payload.options,
                tools: payload.tools ?? null,
                providerOptions: payload.providerOptions ?? null,
                attachments: payload.attachments ?? [],
                reasoning: {
                  enabled: false,
                  effort: "medium" as const,
                  budgetTokens: "" as const,
                },
              },
            ];

      type ExecutionJob = {
        resultId: string;
        run: (typeof runs)[number];
        runLabel: string;
        modelConfig: (typeof models)[number];
        modelLabel: string;
        attachments: Array<{ name: string; mime: string; base64: string }>;
        reasoning: ModelSettings.Reasoning;
        shell: PromptRunResultShell;
      };

      const jobs: ExecutionJob[] = [];
      const shells: PromptRunResultShell[] = [];

      for (const modelConfig of models) {
        const modelLabel = modelConfig.label ?? modelConfig.modelId ?? "Model";
        const reasoning = modelConfig.reasoning ?? {
          enabled: false,
          effort: "medium" as const,
          budgetTokens: "" as const,
        };
        const attachments = Array.isArray(modelConfig.attachments)
          ? modelConfig.attachments
          : [];

        for (const run of runs) {
          const runLabel = run.label ?? "Run";
          const resultId = nanoid();
          const shell: PromptRunResultShell = {
            resultId,
            label: `${modelLabel} • ${runLabel}`,
            runLabel,
            model: {
              key: modelConfig.key,
              id: modelConfig.modelId ?? null,
              providerId: modelConfig.providerId ?? null,
              label: modelConfig.label ?? modelConfig.modelId ?? null,
              settings: {
                options: modelConfig.options,
                // @ts-expect-error
                reasoning,
                providerOptions: modelConfig.providerOptions ?? null,
                tools: modelConfig.tools ?? null,
                attachments,
              },
            },
            streaming: streamingEnabled,
          };

          jobs.push({
            resultId,
            run,
            runLabel,
            modelConfig,
            modelLabel,
            // @ts-expect-error
            attachments,
            // @ts-expect-error
            reasoning,
            shell,
          });
          shells.push(shell);
        }
      }

      const startedMessage: RunMessage.ServerStart = {
        type: "run-server-start",
        payload: {
          runId,
          promptId,
          timestamp: now(),
          streaming: streamingEnabled,
          results: shells,
          runSettings: payload.runSettings,
        },
      };
      this.#messages.send(startedMessage);

      if (this.#cancelledRuns.has(runId)) {
        this.#cancelledRuns.delete(runId);
        const cancelMessage = "Prompt run cancelled.";
        sendRunError(cancelMessage);

        const completedMessage: RunMessage.ServerComplete = {
          type: "run-server-complete",
          payload: {
            runId,
            promptId,
            timestamp: now(),
            success: false,
            results: [],
          },
        };
        this.#messages.send(completedMessage);

        this.#messages.send({
          type: "run-server-execution-result",
          payload: {
            success: false,
            error: cancelMessage,
            results: [],
            promptId,
            timestamp: now(),
            runSettings: payload.runSettings,
            runId,
          },
        });
        return;
      }

      const configuration = vscode.workspace.getConfiguration("mindrig");
      const parallelSetting = configuration.get<number | string>(
        "run.parallel",
        4,
      );
      const numericParallel =
        typeof parallelSetting === "number"
          ? parallelSetting
          : Number(parallelSetting);
      const concurrency =
        Number.isFinite(numericParallel) && numericParallel > 0
          ? Math.floor(numericParallel)
          : 1;

      const queue = new PQueue({ concurrency });
      const resultDataById = new Map<string, PromptRunResultData>();

      const enqueueJob = (job: ExecutionJob) =>
        queue.add(async () => {
          if (this.#cancelledRuns.has(runId)) return;

          let streamedText = "";
          let jobErrorReported = false;

          const streamingHandlers = streamingEnabled
            ? {
                onTextDelta: async (delta: string) => {
                  streamedText += delta;
                  sendRunUpdate(job.resultId, delta);
                },
                onError: async (err: unknown) => {
                  const message = this.#formatExecutionError(err);
                  jobErrorReported = true;
                  sendRunError(message, job.resultId);
                },
              }
            : undefined;

          const extras = {
            tools: job.modelConfig.tools ?? null,
            toolChoice: payload.toolChoice,
            providerOptions: job.modelConfig.providerOptions ?? null,
          };

          const controller = new AbortController();
          this.#addRunController(runId, controller);

          const runtimeOptions = {
            signal: controller.signal,
            ...(streamingHandlers ? { streamingHandlers } : {}),
          };

          try {
            const result = await this.#execute(
              job.run.substitutedPrompt,
              job.modelConfig.modelId ?? undefined,
              job.modelConfig.options,
              extras,
              job.attachments,
              runtimeOptions,
            );

            if (controller.signal.aborted) {
              this.#cancelledRuns.add(runId);
              return;
            }

            if (result.success) {
              const finalText =
                typeof result.text === "string"
                  ? result.text
                  : streamedText || null;

              const completedResult: PromptRunResultData = {
                resultId: job.resultId,
                success: true,
                prompt: job.run.substitutedPrompt,
                text: finalText,
                label: job.shell.label,
                runLabel: job.runLabel,
                request: result.request,
                response: result.response,
                usage: result.usage,
                totalUsage: result.totalUsage,
                steps: (result as any).steps,
                finishReason: (result as any).finishReason ?? null,
                warnings: (result as any).warnings,
                model: job.shell.model,
              };

              resultDataById.set(job.resultId, completedResult);
              const resultCompletedMessage: RunMessage.ServerResultComplete = {
                type: "run-server-result-complete",
                payload: {
                  runId,
                  promptId,
                  timestamp: now(),
                  result: completedResult,
                },
              };
              this.#messages.send(resultCompletedMessage);
            } else {
              const errorMessage = this.#formatExecutionError(result.error);
              if (!jobErrorReported) sendRunError(errorMessage, job.resultId);

              const failedResult: PromptRunResultData = {
                resultId: job.resultId,
                success: false,
                prompt: job.run.substitutedPrompt,
                text: null,
                label: job.shell.label,
                runLabel: job.runLabel,
                error: errorMessage,
                model: job.shell.model,
              };

              resultDataById.set(job.resultId, failedResult);
              const failureMessage: RunMessage.ServerResultComplete = {
                type: "run-server-result-complete",
                payload: {
                  runId,
                  promptId,
                  timestamp: now(),
                  result: failedResult,
                },
              };
              this.#messages.send(failureMessage);
            }
          } catch (error) {
            if (!controller.signal.aborted) {
              const formatted = this.#formatExecutionError(error);
              if (!jobErrorReported) sendRunError(formatted, job.resultId);

              const failedResult: PromptRunResultData = {
                resultId: job.resultId,
                success: false,
                prompt: job.run.substitutedPrompt,
                text: null,
                label: job.shell.label,
                runLabel: job.runLabel,
                error: formatted,
                model: job.shell.model,
              };

              resultDataById.set(job.resultId, failedResult);
              const failureMessage: RunMessage.ServerResultComplete = {
                type: "run-server-result-complete",
                payload: {
                  runId,
                  promptId,
                  timestamp: now(),
                  result: failedResult,
                },
              };
              this.#messages.send(failureMessage);
            } else {
              this.#cancelledRuns.add(runId);
            }
          } finally {
            this.#removeRunController(runId, controller);
          }
        });

      for (const job of jobs) enqueueJob(job);

      await queue.onIdle();

      const wasCancelled = this.#cancelledRuns.has(runId);

      if (wasCancelled) {
        const cancelMessage = "Prompt run cancelled.";
        for (const job of jobs) {
          if (resultDataById.has(job.resultId)) continue;
          const cancelledResult: PromptRunResultData = {
            resultId: job.resultId,
            success: false,
            prompt: job.run.substitutedPrompt,
            text: null,
            label: job.shell.label,
            runLabel: job.runLabel,
            error: cancelMessage,
            model: job.shell.model,
          };
          resultDataById.set(job.resultId, cancelledResult);
          const cancelledMessage: RunMessage.ServerResultComplete = {
            type: "run-server-result-complete",
            payload: {
              runId,
              promptId,
              timestamp: now(),
              result: cancelledResult,
            },
          };
          this.#messages.send(cancelledMessage);
        }
        sendRunError(cancelMessage);
      }

      const aggregatedResults = jobs
        .map((job) => resultDataById.get(job.resultId))
        .filter((result): result is PromptRunResultData => Boolean(result));

      const overallSuccess =
        aggregatedResults.length > 0 &&
        aggregatedResults.every((result) => result.success);

      this.#activeRunControllers.delete(runId);
      this.#cancelledRuns.delete(runId);

      const completedMessage: RunMessage.ServerComplete = {
        type: "run-server-complete",
        payload: {
          runId,
          promptId,
          timestamp: now(),
          success: !wasCancelled && overallSuccess,
          results: aggregatedResults,
        },
      };
      this.#messages.send(completedMessage);

      this.#messages.send({
        type: "run-server-execution-result",
        payload: {
          success: !wasCancelled && overallSuccess,
          results: aggregatedResults,
          promptId,
          timestamp: now(),
          runSettings: payload.runSettings,
          runId,
        },
      });
    } catch (error) {
      console.error("Error executing prompt:", error);
      const formatted = this.#formatExecutionError(error);
      const message = `Unexpected error: ${formatted}`;
      sendRunError(message);
      this.#activeRunControllers.delete(runId);
      this.#cancelledRuns.delete(runId);
      this.#messages.send({
        type: "run-server-execution-result",
        payload: {
          success: false,
          error: message,
          promptId,
          timestamp: now(),
          results: [],
          runId,
        },
      });
    }
  }

  async #handleStopPromptRun(payload: RunMessage.ClientStop["payload"]) {
    const runId = typeof payload?.runId === "string" ? payload.runId : null;
    if (!runId) return;

    const controllers = this.#activeRunControllers.get(runId);
    if (controllers) {
      for (const controller of controllers)
        if (!controller.signal.aborted) controller.abort();
      this.#activeRunControllers.delete(runId);
    }

    this.#cancelledRuns.add(runId);
  }

  #formatExecutionError(error: unknown): string {
    if (typeof error === "string") {
      const normalized = error.startsWith("Failed to execute prompt: ")
        ? error.slice("Failed to execute prompt: ".length)
        : error;
      return normalized;
    }

    if (error instanceof Error) {
      const message = error.message || "Unknown error occurred";

      if (
        error.name === "AbortError" ||
        message.toLowerCase().includes("abort")
      )
        return "Prompt run cancelled.";

      if (
        message.includes("network socket disconnected") ||
        message.includes("TLS connection")
      )
        return "Network connectivity issue. Please check your internet connection and try again.";

      if (
        message.includes("401") ||
        message.toLowerCase().includes("unauthorized")
      )
        return "Invalid API key. Please verify your Vercel Gateway API key is correct.";

      if (message.includes("429"))
        return "Rate limit exceeded. Please wait a moment and try again.";

      if (
        message.includes("500") ||
        message.includes("502") ||
        message.includes("503")
      )
        return "Server error. The Vercel Gateway service may be temporarily unavailable.";

      return message;
    }

    return "Unknown error occurred";
  }

  #addRunController(runId: string, controller: AbortController) {
    const existing = this.#activeRunControllers.get(runId);
    if (existing) existing.add(controller);
    else this.#activeRunControllers.set(runId, new Set([controller]));
  }

  #removeRunController(runId: string, controller: AbortController) {
    const existing = this.#activeRunControllers.get(runId);
    if (!existing) return;
    existing.delete(controller);
    if (existing.size === 0) this.#activeRunControllers.delete(runId);
  }

  async #execute(
    promptText: string,
    modelId?: string,
    options?: RunManager.ExecuteOptions,
    extras?: RunManager.ExecuteExtras,
    attachments?: Array<{ name: string; mime: string; base64: string }>,
    runtimeOptions?: RunManager.ExecuteRuntimeOptions,
  ): Promise<
    | {
        success: true;
        request: LanguageModelRequestMetadata;
        response: LanguageModelResponseMetadata;
        usage?: LanguageModelUsage | undefined;
        totalUsage?: LanguageModelUsage | undefined;
        text?: string | null;
        steps?: RunManager.ExecuteStreamFinishEvent["steps"];
        finishReason?:
          | RunManager.ExecuteStreamFinishEvent["finishReason"]
          | null;
        warnings?: RunManager.ExecuteStreamFinishEvent["warnings"];
      }
    | { success: false; error: string }
  > {
    const apiKey = await this.#secrets.get("auth-vercel-gateway-key");

    if (!apiKey)
      return {
        success: false,
        error:
          "No Vercel Gateway API key configured. Please set your API key first.",
      };

    try {
      const gateway = createGateway({ apiKey: apiKey });

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
          const buf = Buffer.from(att.base64, "base64");
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
      let summary: RunManager.ExecuteSummary | null = null;

      const stream = streamText({
        ...streamArgs,
        abortSignal: runtimeOptions?.signal,
        onChunk:
          onChunkHandler || onTextDeltaHandler
            ? async ({ chunk }: { chunk: RunManager.ExecuteStreamChunk }) => {
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
        onFinish: async (event: RunManager.ExecuteStreamFinishEvent) => {
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
            request: event.request as LanguageModelRequestMetadata,
            response: responseWithoutMessages as LanguageModelResponseMetadata,
            steps: event.steps,
            finishReason: event.finishReason,
          };
          if (event.warnings !== undefined) summary.warnings = event.warnings;
        },
      });

      stream.request;

      await stream.consumeStream();

      if (!summary) {
        summary = await (async (): Promise<RunManager.ExecuteSummary> => {
          const [request, response, usage, totalUsage, text] =
            await Promise.all([
              stream.request.catch(() => null),
              stream.response.catch(() => null),
              stream.usage.catch(() => null),
              stream.totalUsage.catch(() => null),
              stream.text.catch(() => null),
            ]);

          let responseWithoutMessages: LanguageModelResponseMetadata =
            (response as LanguageModelResponseMetadata) ??
            ({} as LanguageModelResponseMetadata);
          if (
            response &&
            typeof response === "object" &&
            "messages" in (response as any)
          ) {
            const { messages: _ignored, ...rest } = response as Record<
              string,
              unknown
            >;
            responseWithoutMessages = rest as LanguageModelResponseMetadata;
          }

          const fallbackSummary: RunManager.ExecuteSummary = {
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
            request:
              (request as LanguageModelRequestMetadata) ??
              ({} as LanguageModelRequestMetadata),
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

  //#endregion
}
