export interface PromptVar {
  exp: string;
  span: import("./span.ts").Span;
}

export interface Prompt {
  file: string;
  span: import("./span.ts").Span;
  text: string;
  vars: Array<PromptVar>;
}
