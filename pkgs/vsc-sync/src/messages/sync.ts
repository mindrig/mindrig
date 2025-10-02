import type { SyncResource } from "../resource.js";

export type VscMessageSync =
  | VscMessageSync.Update
  | VscMessageSync.StateVector
  | VscMessageSync.Init;

export namespace VscMessageSync {
  export interface Base<Type extends string> {
    type: Type;
    resource: SyncResource;
  }

  export interface Update extends Base<"sync-update"> {
    payload: {
      update: number[];
    };
  }

  export interface StateVector extends Base<"sync-state-vector"> {
    payload: {
      stateVector: number[];
    };
  }

  export interface Init extends Base<"sync-init"> {}
}
