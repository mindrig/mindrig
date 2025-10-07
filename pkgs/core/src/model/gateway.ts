import { ModelVercel } from "./vercel";

export namespace ModelGateway {
  //#region Model

  export type Model = ModelVercel.GatewayModel;

  //#endregion

  //#region List

  //#region List response

  export type ListResponse = ModelVercel.ListResponse;

  export type ListResponseValue = ListResponse | undefined;

  export type ListResponseOk = ListResponse & { data: ListDataOk };

  export type ListResponseOkValue = ListResponseOk | undefined | null;

  //#endregion

  //#region List data

  export type ListDataOk = ListResponse["data"] & { status: "ok" };

  //#endregion

  //#region List source

  export type ListSource = ListSourceAuth | ListSourceGlobal;

  export type ListSourceType = ListSource["type"];

  export interface ListSourceAuth {
    type: "auth";
    hash: string;
  }

  export interface ListSourceGlobal {
    type: "global";
  }

  //#endregion

  //#endregion
}
