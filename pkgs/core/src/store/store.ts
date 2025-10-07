export type Store = {
  "playground.streaming"?: boolean | undefined;
};

export namespace Store {
  export type Key = keyof Store;

  export type Scope = "global" | "workspace";

  export type Resolve<Type extends Store.Scope> = Type extends "global"
    ? Global
    : Workspace;

  export type ResolveKeys<Type extends Store.Scope> =
    keyof Resolve<Type> extends infer Key extends string ? Key : never;

  export type Global = {
    streaming?: boolean | undefined;
    "playground.streaming"?: boolean | undefined;
  };

  export type GlobalKeys = keyof Global;

  export interface Workspace {}

  export type WorkspaceKeys = keyof Workspace;

  export type Ref<Scope extends Store.Scope, Key extends Store.Key> = {
    scope: Scope;
    key: Key;
  };

  export type RequestId = string & { [requestIdBrand]: true };
  declare const requestIdBrand: unique symbol;
}

// export function storeResolveKeys<Type extends Store.Scope>(
//   type: Type,
// ): Store.ResolveKeys<Type>[] {
//   return (
//     type === "global" ? storeGlobalKeys : storeWorkspaceKeys
//   ) as Store.ResolveKeys<Type>[];
// }

// //#region Global keys

// type GlobalKeysMap = {
//   [Key in keyof Store.Global]: unknown;
// };

// const globalKeysMap: GlobalKeysMap = {
//   streaming: true,
// };

// export const storeGlobalKeys = Object.keys(globalKeysMap) as Store.GlobalKeys[];

// //#endregion

// //#region Workspace keys

// type WorkspaceKeysMap = {
//   [Key in keyof Store.Workspace]: unknown;
// };

// const workspaceKeysMap: WorkspaceKeysMap = {};

// export const storeWorkspaceKeys = Object.keys(
//   workspaceKeysMap,
// ) as Store.WorkspaceKeys[];

//#endregion
