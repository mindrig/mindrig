import { superstate } from "superstate";

export namespace AuthVercelStatechart {
  export type State =
    | "pending"
    | "form"
    | "formSubmitting"
    | superstate.Def<"formErrored", ErroredContext>
    | superstate.Def<"profile", ProfileContext>
    | superstate.Def<"profileErrored", ProfileErroredContext>
    | superstate.Def<"profileValidating", ProfileContext>;

  export interface ErroredContext {
    error: string;
  }

  export interface ProfileContext {
    maskedKey: string;
  }

  export interface ProfileErroredContext
    extends ProfileContext,
      ErroredContext {}

  export type Instance = superstate.Instance<AuthVercelStatechart>;
}

export const authVercelStatechart = superstate<AuthVercelStatechart.State>(
  "auth-vercel",
)
  .state("pending", [
    "missing() -> form",
    "valid() -> profile",
    "error() -> profileErrored",
  ])
  .state("form", ["-> clear!", "submit() -> formSubmitting"])
  .state("formSubmitting", [
    "valid() -> clear! -> profile",
    "error() -> formErrored",
  ])
  .state("formErrored", ["valid() -> profile", "error() -> formErrored"])
  .state("profile", ["edit() -> form", "clear() -> form"])
  .state("profileErrored", [
    "edit() -> form",
    "clear() -> form",
    "revalidate() -> revalidate! -> profileValidating",
  ])
  .state("profileValidating", [
    "valid() -> profile",
    "error() -> profileErrored",
  ]);

export type AuthVercelStatechart = typeof authVercelStatechart;
