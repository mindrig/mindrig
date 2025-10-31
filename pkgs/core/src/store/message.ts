import { Store } from ".";

export namespace StoreMessage {
  //#region Server

  export type Server = ServerGetResponse<any>;

  export interface ServerGetResponse<Key extends Store.Key> {
    type: "store-server-get-response";
    requestId: Store.RequestId;
    payload: Store[Key];
  }

  //#endregion

  //#region Client

  export type Client = ClientSet<any, any> | ClientGet<any, any>;

  export interface ClientSet<Scope extends Store.Scope, Key extends Store.Key> {
    type: "store-client-set";
    payload: ClientSetPayload<Scope, Key>;
  }

  export interface ClientSetPayload<
    Scope extends Store.Scope,
    Key extends Store.Key,
  > {
    ref: Store.Ref<Scope, Key>;
    value: Store[Key];
  }

  export interface ClientGet<Scope extends Store.Scope, Key extends Store.Key> {
    type: "store-client-get";
    requestId: Store.RequestId;
    payload: Store.Ref<Scope, Key>;
  }

  //#endregion
}
