import type { generateText } from "ai";

export namespace AiSdkGenerate {
  export type GenerateResult =
    ReturnType<typeof generateText> extends Promise<infer Result>
      ? Result
      : never;

  export type Response = GenerateResult["response"];

  export type Request = GenerateResult["request"];

  export type Usage = GenerateResult["usage"];
}
