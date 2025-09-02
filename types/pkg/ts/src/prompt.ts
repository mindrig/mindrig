export interface PromptVar {
  exp: string;
  span: import("./span.js").Span;
}

export interface Prompt {
  file: string;
  span: import("./span.js").Span;
  text: string;
  vars: Array<PromptVar>;
}
