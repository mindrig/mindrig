import { Manager } from "@/aspects/manager/Manager.js";
import {
  AiSdkGenerate,
  aiSdkSettings,
  aiSdkUsageToModelUsage,
} from "@wrkspc/core/aiSdk";
import { Attachment } from "@wrkspc/core/attachment";
import { datasourceInputToValues } from "@wrkspc/core/datasource";
import { Result, ResultMessage } from "@wrkspc/core/result";
import { Run } from "@wrkspc/core/run";
import { generateText, ModelMessage, streamText, UserContent } from "ai";
import { log } from "smollog";
import { resolveGateway } from "../gateway/gateway";
import { MessagesManager } from "../message/Manager";
import { promptInterpolate } from "../prompt/interpolate";

export namespace ResultManager {
  export interface Props {
    messages: MessagesManager;
    result: Result.Initialized;
    runId: Run.Id;
    runInit: Run.Init;
    apiKey: string;
    input: Result.Input;
  }

  export type BaseFieldsMap = { [Key in keyof Result.Base<string>]: true };

  export interface GenerateProps {
    readonly attachments: Attachment.Input[];
  }

  export type AiSdkGenerateProps =
    | typeof streamText
    | typeof generateText extends (props: infer Props) => any
    ? Props
    : never;

  export type ErroredOverrides = Partial<
    Omit<Result.Patch<"errored">, "erroredAt" | "startedAt">
  > &
    Pick<Result.Patch<"errored">, "startedAt" | "error">;

  export interface GenerateMethodProps {
    aiSdkProps: AiSdkGenerateProps;
    startedAt: number;
  }

  export interface SuccessProps {
    text: string;
    response: AiSdkGenerate.Response;
    request: AiSdkGenerate.Request;
    totalUsage: AiSdkGenerate.Usage;
    startedAt: number;
  }
}

export class ResultManager extends Manager {
  #messages: MessagesManager;
  #result: Result;
  #runId: Run.Id;
  #runInit: Run.Init;
  #input: Result.Input;
  #apiKey: string;

  constructor(parent: Manager, props: ResultManager.Props) {
    super(parent);

    this.#messages = props.messages;
    this.#result = props.result;
    this.#runId = props.runId;
    this.#runInit = props.runInit;
    this.#input = props.input;
    this.#apiKey = props.apiKey;
  }

  async generate(abortSignal: AbortSignal | undefined) {
    const startedAt = Date.now();

    await this.#syncRunning(startedAt);

    const { setup, datasources } = this.#result.init;
    const { developerId, modelId } = setup.ref;
    if (!developerId)
      return this.#syncErrored({
        error: "Model developer is not specified",
        startedAt,
      });
    if (!modelId)
      return this.#syncErrored({ error: "Model is not specified", startedAt });

    const values = datasourceInputToValues(datasources);
    const interpolatedPrompt = promptInterpolate(this.#runInit.prompt, values);

    const messageContent: UserContent = [
      {
        type: "text",
        text: interpolatedPrompt,
      },
    ];

    this.#input.attachments.forEach((attachment) => {
      messageContent.push({
        type: "file",
        data: attachment.base64,
        filename: attachment.path,
        mediaType: attachment.mime,
      });
    });

    const messages: ModelMessage[] = [
      {
        role: "user",
        content: messageContent,
      },
    ];

    const gateway = resolveGateway(this.#apiKey);

    const aiSdkProps: ResultManager.AiSdkGenerateProps = {
      model: gateway(modelId),
      messages,
      // TODO: Implement tools
      // tools: this.#runInit.tools,
      ...aiSdkSettings({ developerId, modelId }, setup.settings),
    };

    if (abortSignal) aiSdkProps.abortSignal = abortSignal;

    const methodProps: ResultManager.GenerateMethodProps = {
      aiSdkProps,
      startedAt,
    };

    return (
      this.#runInit.streaming
        ? this.#streamGenerate(methodProps)
        : this.#requestGenerate(methodProps)
    ).catch((error) => {
      log.debug("Result generation failed", error);

      this.#syncErrored({
        error: error instanceof Error ? error.message : "Unknown error",
        startedAt,
      });

      // NOTE: We ignore the error here allowing the run to continue processing
      // other results.
    });
  }

  async #streamGenerate(props: ResultManager.GenerateMethodProps) {
    const { aiSdkProps, startedAt } = props;
    const stream = streamText(aiSdkProps);

    const textChunks: string[] = [];

    for await (const textPart of stream.textStream) {
      textChunks.push(textPart);

      await this.#messages.send({
        type: "result-server-stream",
        payload: {
          runId: this.#runId,
          resultId: this.#result.id,
          textChunk: textPart,
        },
      });
    }

    // TODO: Consume request, response and usage if chunks look fails to complete.

    const [response, request, totalUsage] = await Promise.all([
      stream.response,
      stream.request,
      stream.totalUsage,
    ]);

    const text = textChunks.join("");

    return this.#syncSuccess({
      text,
      response,
      request,
      totalUsage,
      startedAt,
    });
  }

  async #requestGenerate(props: ResultManager.GenerateMethodProps) {
    const { aiSdkProps, startedAt } = props;
    try {
      const { text, response, request, totalUsage } =
        await generateText(aiSdkProps);

      return this.#syncSuccess({
        text,
        response,
        request,
        totalUsage,
        startedAt,
      });
    } catch (error) {
      // TODO: Try to capture response, request and usage even if generateText
      // fails. See `GatewayError`.
      log.warn("Text generation request failed", error);
    }
  }

  #syncRunning(startedAt: number) {
    return this.#sync<"running">({
      id: this.#result.id,
      status: "running",
      startedAt,
      updatedAt: startedAt,
      usage: null,
      payload: null,
    });
  }

  async #syncSuccess(props: ResultManager.SuccessProps) {
    const { text, response, request, totalUsage, startedAt } = props;

    return this.#sync<"success">({
      id: this.#result.id,
      status: "success",
      endedAt: Date.now(),
      request: { payload: request },
      response: { payload: response },
      usage: aiSdkUsageToModelUsage(totalUsage),
      payload: {
        type: "language",
        content: {
          type: "text",
          text,
        },
      },
      startedAt,
    });
  }

  async #syncErrored(overrides: ResultManager.ErroredOverrides) {
    await this.#sync<"errored">({
      id: this.#result.id,
      status: "errored",
      error: overrides.error,
      endedAt: Date.now(),
      usage: overrides.usage ?? null,
      request: overrides.request ?? null,
      response: overrides.response ?? null,
      payload: overrides.payload ?? null,
      startedAt: overrides.startedAt,
    });

    return this.dispose();
  }

  async #sync<Status extends Result.Status>(patch: Result.Patch<Status>) {
    this.#assign(patch);

    await this.#messages.send({
      type: "result-server-update",
      payload: {
        runId: this.#runId,
        // TODO: Figure out if TS can infer this type automatically
        patch: patch as ResultMessage.ServerUpdatePayloadPatch,
      },
    });
  }

  #assign<Status extends Result.Status>(patch: Result.Patch<Status>) {
    const result = this.#result as Record<string, any>;
    for (const key in result) {
      if (BASE_FIELDS.includes(key)) continue;
      delete result[key];
    }
    Object.assign(result, patch);
  }
}

const BASE_FIELDS_MAP: ResultManager.BaseFieldsMap = {
  status: true,
  createdAt: true,
  id: true,
  init: true,
};

const BASE_FIELDS = Object.keys(BASE_FIELDS_MAP);
