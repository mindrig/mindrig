import type { PropsWithChildren } from "react";

export function Streamdown({ children }: PropsWithChildren) {
  return <div data-testid="streamdown-mock">{children}</div>;
}

export type StreamdownProps = PropsWithChildren;
