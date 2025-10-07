import { AuthGateway } from "./gateway.js";
export * from "./gateway.js";

export interface Auth {
  gateway: Auth.GatewayValue;
}

export namespace Auth {
  export type GatewayValue = AuthGateway | undefined | null;
}
