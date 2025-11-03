import type { PlaygroundMap, PlaygroundState } from "../playground/index.js";
import { Result } from "../result/result.js";
import { Versioned } from "../versioned/versioned.js";

export type Store = {
  "playground.map"?: Versioned.Only<PlaygroundMap> | undefined;
  "playground.streaming"?: boolean | undefined;
  "playground.pin"?: Versioned.Only<PlaygroundState.Ref> | null | undefined;
  "playground.results.layout"?: Result.Layout | undefined;
};

export namespace Store {
  export type Key = keyof Store;

  export type Scope = "global" | "workspace";

  export type Ref<Scope extends Store.Scope, Key extends Store.Key> = {
    scope: Scope;
    key: Key;
  };

  export type RequestId = string & { [requestIdBrand]: true };
  declare const requestIdBrand: unique symbol;
}
