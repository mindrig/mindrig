export interface ResultAppState {
  tab?: ResultAppState.Tab | undefined;
}

export namespace ResultAppState {
  export type Tab = "request" | "response" | "usage";
}

export function buildResultAppState(): ResultAppState {
  return {};
}
