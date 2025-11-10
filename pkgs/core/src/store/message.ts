import { Store } from ".";

export namespace StoreMessage {
  //#region Server

  export type Server = ServerGetResponse<any>;

  export interface ServerGetResponse<Prop extends Store.Prop> {
    type: "store-server-get-response";
    requestId: Store.RequestId;
    payload: Store[Prop];
  }

  //#endregion

  //#region Client

  export type Client = ClientSet<any, any> | ClientGet<any, any>;

  export interface ClientSet<
    Scope extends Store.Scope,
    Prop extends Store.Prop,
  > {
    type: "store-client-set";
    payload: ClientSetPayload<Scope, Prop>;
  }

  export interface ClientSetPayload<
    Scope extends Store.Scope,
    Prop extends Store.Prop,
  > {
    ref: Store.Ref<Scope, Prop>;
    value: Store[Prop];
  }

  export interface ClientGet<
    Scope extends Store.Scope,
    Prop extends Store.Prop,
  > {
    type: "store-client-get";
    requestId: Store.RequestId;
    payload: Store.Ref<Scope, Prop>;
  }

  //#endregion
}
