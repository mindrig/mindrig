import React from "react";

export function AppLayout(props: React.PropsWithChildren) {
  return <div className="font-display">{props.children}</div>;
}
