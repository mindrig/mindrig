import { AIService } from "@/AIService";
import { Manager } from "@/aspects/manager/Manager.js";
import { VscMessagePromptRun } from "@wrkspc/vsc-message";
import {
  PromptRunErrorMessage,
  PromptRunUpdateMessage,
} from "@wrkspc/vsc-types";
import { nanoid } from "nanoid";
import { MessagesManager } from "../message/Manager";

export namespace RunManager {
  export interface Props {
    messages: MessagesManager;
  }
}

export class RunManager extends Manager {
  #messages: MessagesManager;

  constructor(parent: Manager, props: RunManager.Props) {
    super(parent);

    this.#messages = props.messages;

    this.#aiService = this.register(new AIService());

    this.#messages.listen(this, "prompt-run-wv-execute", (message) =>
      this.#handleExecutePrompt(message.payload),
    );

    this.#messages.listen(this, "prompt-run-vw-stop", (message) =>
      this.#handleStopPromptRun(message.payload),
    );
  }

  //#region Legacy

  #activeRunControllers: Map<string, Set<AbortController>> = new Map();
  #cancelledRuns: Set<string> = new Set();
  #aiService: AIService;
  #lastExecutionPayload: VscMessagePromptRun.WvExecutePayload | null = null;

  #cloneExecutionPayload(
    payload: VscMessagePromptRun.WvExecutePayload,
  ): VscMessagePromptRun.WvExecutePayload {
    return JSON.parse(
      JSON.stringify(payload),
    ) as VscMessagePromptRun.WvExecutePayload;
  }

  async #execute(message: VscMessagePromptRun.WvExecute) {}

  async #handleExecutePrompt(payload: VscMessagePromptRun.WvExecutePayload) {
    this.#lastExecutionPayload = this.#cloneExecutionPayload(payload);

    const runId = nanoid();
    const promptId = payload.promptId;
    const now = () => Date.now();

    const sendRunError = (error: string, resultId?: string) => {
      const payload: PromptRunErrorMessage["payload"] = {
        runId,
        promptId,
        timestamp: now(),
        error,
      };
      if (typeof resultId === "string") payload.resultId = resultId;
      this.#sendMessage({ type: "prompt-run-error", payload });
    };

    const sendRunUpdate = (resultId: string, delta: string) => {
      const message: PromptRunUpdateMessage = {
        type: "prompt-run-update",
        payload: {
          runId,
          promptId,
          resultId,
          timestamp: now(),
          delta: { type: "text", text: delta },
        },
      };
      this.#sendMessage(message);
    };

    if (!this.#secretManager) {
      const error = "Secret manager not initialized";
      sendRunError(error);
      this.#sendMessage({
        type: "prompt-run-execution-result",
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

    const apiKey = await this.#secretManager.get();
    if (!apiKey) {
      const error =
        "No Vercel Gateway API key configured. Please set your API key in the panel above.";
      sendRunError(error);
      this.#sendMessage({
        type: "prompt-run-execution-result",
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

    this.#aiService!.setApiKey(apiKey);

    let streamingEnabled: boolean;
    if (typeof payload.streamingEnabled === "boolean")
      streamingEnabled = payload.streamingEnabled;
    else if ((payload.runSettings as any)?.streaming?.enabled !== undefined)
      streamingEnabled = !!(payload.runSettings as any)?.streaming?.enabled;
    else
      streamingEnabled =
        this.#context.globalState.get<boolean>(
          this.#streamingPreferenceKey,
          true,
        ) ?? true;

    payload.streamingEnabled = streamingEnabled;
    payload.runSettings = {
      ...(payload.runSettings ?? {}),
      streaming: { enabled: streamingEnabled },
    };

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
        attachments: Array<{ name: string; mime: string; dataBase64: string }>;
        reasoning: {
          enabled: boolean;
          effort: "low" | "medium" | "high";
          budgetTokens?: number | "";
        };
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
            attachments,
            reasoning,
            shell,
          });
          shells.push(shell);
        }
      }

      const startedMessage: PromptRunStartMessage = {
        type: "prompt-run-start",
        payload: {
          runId,
          promptId,
          timestamp: now(),
          streaming: streamingEnabled,
          results: shells,
          runSettings: payload.runSettings,
        },
      };
      this.#sendMessage(startedMessage);

      if (this.#cancelledRuns.has(runId)) {
        this.#cancelledRuns.delete(runId);
        const cancelMessage = "Prompt run cancelled.";
        sendRunError(cancelMessage);

        const completedMessage: PromptRunCompleteMessage = {
          type: "prompt-run-complete",
          payload: {
            runId,
            promptId,
            timestamp: now(),
            success: false,
            results: [],
          },
        };
        this.#sendMessage(completedMessage);

        this.#sendMessage({
          type: "prompt-run-execution-result",
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
            const result = await this.#aiService!.executePrompt(
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
              const resultCompletedMessage: PromptRunResultCompleteMessage = {
                type: "prompt-run-result-complete",
                payload: {
                  runId,
                  promptId,
                  timestamp: now(),
                  result: completedResult,
                },
              };
              this.#sendMessage(resultCompletedMessage);
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
              const failureMessage: PromptRunResultCompleteMessage = {
                type: "prompt-run-result-complete",
                payload: {
                  runId,
                  promptId,
                  timestamp: now(),
                  result: failedResult,
                },
              };
              this.#sendMessage(failureMessage);
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
              const failureMessage: PromptRunResultCompleteMessage = {
                type: "prompt-run-result-complete",
                payload: {
                  runId,
                  promptId,
                  timestamp: now(),
                  result: failedResult,
                },
              };
              this.#sendMessage(failureMessage);
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
          const cancelledMessage: PromptRunResultCompleteMessage = {
            type: "prompt-run-result-complete",
            payload: {
              runId,
              promptId,
              timestamp: now(),
              result: cancelledResult,
            },
          };
          this.#sendMessage(cancelledMessage);
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

      const completedMessage: PromptRunCompleteMessage = {
        type: "prompt-run-complete",
        payload: {
          runId,
          promptId,
          timestamp: now(),
          success: !wasCancelled && overallSuccess,
          results: aggregatedResults,
        },
      };
      this.#sendMessage(completedMessage);

      this.#sendMessage({
        type: "prompt-run-execution-result",
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
      this.#sendMessage({
        type: "prompt-run-execution-result",
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

  async #handleStopPromptRun(payload: StopPromptRunPayload) {
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

  //#endregion
}
