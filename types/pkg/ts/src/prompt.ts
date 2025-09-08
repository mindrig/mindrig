export interface PromptVar {
  exp: string;
  span: import("./span.js").SpanShape;
}

export interface Prompt {
  file: string;
  span: import("./span.js").SpanShape;
  exp: string;
  vars: Array<PromptVar>;
}
