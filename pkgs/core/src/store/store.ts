import { Assessment } from "../assessment/assessment.js";
import type { PlaygroundMap, PlaygroundState } from "../playground/index.js";
import { Result } from "../result/result.js";
import { Versioned } from "../versioned/versioned.js";

export type Store = Store.Map<
  {
    "playground.map": PlaygroundMap;
    "playground.streaming": boolean;
    "playground.pin": PlaygroundState.Ref;
    "playground.results.layout": Result.Layout;
  } & Assessment.Store
>;

export namespace Store {
  export type Prop = keyof Store;

  export type Map<Values extends ValuesConstraint> = {
    [Prop in keyof Values]?: Versioned.Only<Values[Prop]> | undefined;
  };

  export type ValuesConstraint = Record<string, {}>;

  export type Value<Prop extends Store.Prop> = Store[Prop] & {};

  export type Scope = "global" | "workspace";

  export type Ref<Scope extends Store.Scope, Prop extends Store.Prop> = {
    scope: Scope;
    prop: Prop;
  };

  export type RequestId = string & { [requestIdBrand]: true };
  declare const requestIdBrand: unique symbol;
}
