import { superstate } from "superstate";

export type AuthVercelFormState =
  | "pending"
  | "form"
  | "saving"
  | "errored"
  | "present";

export const authVercelFormState = superstate<AuthVercelFormState>(
  "auth-vercel",
)
  .state("pending", [
    "verify() -> present",
    "blank() -> form",
    "error() -> errored",
  ])
  .state("form", ["-> clear!", "save() -> saving"])
  .state("saving", ["verify() -> clear! -> present", "error() -> errored"])
  .state("errored", "save() -> saving")
  .state("present", ["edit() -> form", "clear() -> form"]);
