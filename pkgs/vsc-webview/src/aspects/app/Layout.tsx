import React from "react";
import { AppFooter } from "./Footer";

export function AppLayout(props: React.PropsWithChildren) {
  return (
    <div className="font-display h-full flex flex-col">
      {props.children}

      <AppFooter />
    </div>
  );
}
