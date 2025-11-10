import { Manager } from "@/aspects/manager/Manager.js";
import { Result } from "@wrkspc/core/result";
import { MessagesManager } from "../message/Manager";

export namespace ResultManager {
  export interface Props {
    messages: MessagesManager;
    result: Result.Initialized;
  }

  export type BaseFieldsMap = { [Key in keyof Result.Base<string>]: true };
}

export class ResultManager extends Manager {
  #messages: MessagesManager;
  #result: Result;

  constructor(parent: Manager, props: ResultManager.Props) {
    super(parent);

    this.#messages = props.messages;
    this.#result = props.result;
  }

  async generate() {}

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
