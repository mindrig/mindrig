export interface Span {
  start: number;
  end: number;
}

export interface SpanShape {
  outer: Span;
  inner: Span;
}
