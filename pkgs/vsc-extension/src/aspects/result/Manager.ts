import { Manager } from "@/aspects/manager/Manager.js";
import { AttachmentInput } from "@wrkspc/core/attachment";
import { Result } from "@wrkspc/core/result";
import { MessagesManager } from "../message/Manager";
import { Secret } from "../secret/types";

export namespace ResultManager {
  export interface Props {
    messages: MessagesManager;
    result: Result.Initialized;
    abort: AbortController;
    apiKey: Secret.Value;
    input: Result.Input;
  }

  export type BaseFieldsMap = { [Key in keyof Result.Base<string>]: true };

  export interface GenerateProps {
    readonly attachments: AttachmentInput[];
  }
}

export class ResultManager extends Manager {
  #messages: MessagesManager;
  #result: Result;
  #input: Result.Input;
  #abort: AbortController;
  #apiKey: Secret.Value;

  constructor(parent: Manager, props: ResultManager.Props) {
    super(parent);

    this.#messages = props.messages;
    this.#result = props.result;
    this.#input = props.input;
    this.#abort = props.abort;
    this.#apiKey = props.apiKey;
  }

  async generate() {
    return 123;
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
