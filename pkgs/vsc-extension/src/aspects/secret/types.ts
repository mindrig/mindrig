export namespace Secret {
  export type Key = (typeof secrets)[number];

  export type Value = string | undefined;
}

export const secrets = ["auth-vercel-gateway-key"] as const;
