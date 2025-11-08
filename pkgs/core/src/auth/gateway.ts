export type AuthGateway = AuthGateway.Vercel;

export namespace AuthGateway {
  export type Type = AuthGateway["type"];

  export type DefaultType = typeof defaultAuthGatewayType;

  export interface Vercel {
    type: "vercel";
    maskedKey: string;
    error?: string | undefined;
  }

  export interface Resolve<Type extends AuthGateway.Type> {
    type: Type;
    gateway: (AuthGateway & { type: Type }) | undefined | null;
  }
}

export const defaultAuthGatewayType = "vercel" satisfies AuthGateway.Type;
