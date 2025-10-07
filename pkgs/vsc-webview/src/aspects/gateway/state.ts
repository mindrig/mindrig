import { superstate } from "superstate";

export type GatewayAuthState = "pending" | "absent" | "present" | "errored";

export const gatewayAuthState = superstate<GatewayAuthState>("auth")
  .state("pending", [
    "verify() -> present",
    "blank() -> absent",
    "error() -> errored",
  ])
  .state("absent", ["set() -> pending"])
  .state("errored", ["set() -> pending"])
  .state("present", ["clear() -> absent"]);
