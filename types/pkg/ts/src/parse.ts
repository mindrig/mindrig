import { Prompt } from "./prompt.ts";

export type ParseResult = ParseResultError | ParseResultSuccess;

export interface ParseResultError {
  state: "error";
  error: string;
}

export interface ParseResultSuccess {
  state: "success";
  prompts: Array<Prompt>;
}
