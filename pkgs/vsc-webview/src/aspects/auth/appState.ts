import { AuthGateway } from "@wrkspc/core/auth";

export type AuthAppState = AuthAppState.Form | AuthAppState.Profile;

export namespace AuthAppState {
  export interface Form {
    type: "form";
    error?: string | undefined;
  }

  export interface Profile {
    type: "profile";
    maskedKey: string;
    error?: string | undefined;
  }
}

export function buildAuthAppState(
  gateway: AuthGateway.Vercel | null,
): AuthAppState {
  if (gateway)
    return {
      type: "profile",
      maskedKey: gateway.maskedKey,
      error: gateway.error,
    };

  return {
    type: "form",
  };
}
