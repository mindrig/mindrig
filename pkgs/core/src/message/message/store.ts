import { Store } from "../../store";

export namespace VscMessageStore {
  //#region Extension

  export type Extension = ExtGetResponse<any>;

  export interface ExtGetResponse<Key extends Store.Key> {
    type: "store-ext-get-response";
    requestId: Store.RequestId;
    payload: Store[Key];
  }

  //#endregion

  //#region Webview

  export type Webview = WvSet<any, any> | WvGet<any, any>;

  export interface WvSet<Scope extends Store.Scope, Key extends Store.Key> {
    type: "store-wv-set";
    payload: WvSetPayload<Scope, Key>;
  }

  export interface WvSetPayload<
    Scope extends Store.Scope,
    Key extends Store.Key,
  > {
    ref: Store.Ref<Scope, Key>;
    value: Store[Key];
  }

  export interface WvGet<Scope extends Store.Scope, Key extends Store.Key> {
    type: "store-wv-get";
    requestId: Store.RequestId;
    payload: Store.Ref<Scope, Key>;
  }

  //#endregion
}
