import { ModelsMessage } from "@wrkspc/core/model";

export namespace ModelsAppState {
  export interface Base {
    waiting: boolean;
  }

  export interface Gateway extends Base {
    payload: ModelsMessage.ServerGatewayResponse["payload"] | undefined;
  }

  export interface Dotdev extends Base {
    payload: ModelsMessage.ServerDotdevResponse["payload"] | undefined;
  }

  export interface Any extends Base {
    payload: any;
  }
}
