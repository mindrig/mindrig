/**
 * Sync message.
 */
export type SyncMessage =
  | SyncMessage.Update
  | SyncMessage.StateVector
  | SyncMessage.Init;

export namespace SyncMessage {
  /**
   * Base message interface.
   */
  export interface Base<Type extends string> {
    type: Type;
  }

  /**
   * Sync message sent from webview to extension with Yjs update data.
   */
  export interface Update extends Base<"sync-update"> {
    payload: {
      // Yjs update serialized as number array.
      update: number[];
    };
  }

  /**
   * Sync message sent between webview and extension with state vector data.
   */
  export interface StateVector extends Base<"sync-state-vector"> {
    payload: {
      // Yjs state vector serialized as number array.
      stateVector: number[];
    };
  }

  /**
   * Sync message sent from webview to extension requesting initial sync.
   */
  export interface Init extends Base<"sync-init"> {}
}
