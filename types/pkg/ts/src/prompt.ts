export interface PromptVar {
  exp: string;
  loc: import("./span.ts").Span;
}

export interface Prompt {
  file: string;
  loc: import("./span.ts").Span;
  text: string;
  vars: Array<PromptVar>;
}
