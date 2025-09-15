import { VscProvider } from "@/aspects/vsc/Context";
import React from "react";

export function Context(props: React.PropsWithChildren) {
  return <VscProvider>{props.children}</VscProvider>;
}
