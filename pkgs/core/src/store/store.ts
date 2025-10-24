import type { PlaygroundMap, PlaygroundState } from "../playground/index.js";

export type Store = {
  "playground.map"?: PlaygroundMap | undefined;
  "playground.streaming"?: boolean | undefined;
  "playground.pin"?: PlaygroundState.Ref | null | undefined;
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
