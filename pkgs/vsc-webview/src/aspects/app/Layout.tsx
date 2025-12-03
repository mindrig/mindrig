import React from "react";

export function AppLayout(props: React.PropsWithChildren) {
  return (
    <div className="font-display h-full flex flex-col">{props.children}</div>
  );
}
