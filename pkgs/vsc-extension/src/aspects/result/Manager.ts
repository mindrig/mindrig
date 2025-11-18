import { Manager } from "@/aspects/manager/Manager.js";
import { createGateway } from "@ai-sdk/gateway";
import { AttachmentInput } from "@wrkspc/core/attachment";
import { Result } from "@wrkspc/core/result";
import { Run } from "@wrkspc/core/run";
import { generateText, streamText } from "ai";
import { todo } from "alwaysly";
import { MessagesManager } from "../message/Manager";
import { promptInterpolate } from "../prompt/interpolate";

export namespace ResultManager {
  export interface Props {
    messages: MessagesManager;
    result: Result.Initialized;
    runInit: Run.Init;
    abort: AbortController;
    apiKey: string;
    input: Result.Input;
  }

  export type BaseFieldsMap = { [Key in keyof Result.Base<string>]: true };

  export interface GenerateProps {
    readonly attachments: AttachmentInput[];
  }

  export type AiSdkGenerateProps =
    | typeof streamText
    | typeof generateText extends (props: infer Props) => any
    ? Props
    : never;

  export type ErrorOverrides = Partial<
    Omit<Result.Patch<"error">, "erroredAt" | "startedAt">
  > &
    Pick<Result.Patch<"error">, "startedAt" | "error">;
}

export class ResultManager extends Manager {
  #messages: MessagesManager;
  #result: Result;
  #runInit: Run.Init;
  #input: Result.Input;
  #abort: AbortController;
  #apiKey: string;

  constructor(parent: Manager, props: ResultManager.Props) {
    super(parent);

    this.#messages = props.messages;
    this.#result = props.result;
    this.#runInit = props.runInit;
    this.#input = props.input;
    this.#abort = props.abort;
    this.#apiKey = props.apiKey;
  }

  async generate(signal: AbortSignal | undefined) {
    const startedAt = Date.now();
    const gateway = createGateway({ apiKey: this.#apiKey });

    const modelId = this.#result.init.setup.ref.modelId;
    if (!modelId)
      return this.#error({ error: "Model is not specified", startedAt });

    const interpolatedPrompt = promptInterpolate(this.#runInit.prompt, todo());

    const generateProps: ResultManager.AiSdkGenerateProps = {
      model: modelId,
      prompt: interpolatedPrompt,
    };

    if (this.#runInit.streaming) {
      const stream = streamText(generateProps);
      todo("Subscribe to stream and update result with partial data");
    } else {
      const generated = await generateText(generateProps);
      todo("Update result with success");
    }
  }

  #assign<Status extends Result.Status>(patch: Result.Patch<Status>) {
    const result = this.#result as Record<string, any>;
    for (const key in result) {
      if (BASE_FIELDS.includes(key)) continue;
      delete result[key];
    }
    Object.assign(result, patch);
  }

  async #error(overrides: ResultManager.ErrorOverrides) {
    await this.#messages.send({
      type: "result-server-update",
      payload: {
        id: this.#result.id,
        status: "error",
        error: overrides.error,
        erroredAt: Date.now(),
        usage: overrides.usage ?? null,
        request: overrides.request ?? null,
        response: overrides.response ?? null,
        payload: overrides.payload ?? null,
        startedAt: overrides.startedAt,
      },
    });
    return this.dispose();
  }
}

const BASE_FIELDS_MAP: ResultManager.BaseFieldsMap = {
  status: true,
  createdAt: true,
  id: true,
  init: true,
};

const BASE_FIELDS = Object.keys(BASE_FIELDS_MAP);
