import type { Size } from "@wrkspc/theme";
import { cn } from "crab";
import { LogoSVG } from "./LogoSVG.js";

export interface LogoProps extends cn.Props<typeof logoCn> {}

export function Logo(props: LogoProps) {
  return (
    <div className={logoCn(props)}>
      <LogoSVG />
    </div>
  );
}

export type LogoColor = "main" | "inverse";

export type LogoSize = Size | "fill";

export const logoCn = cn<{ color: LogoColor; size: LogoSize }>()
  .color("main", {
    main: "",
    inverse: "text-off-white",
  })
  .size("medium", {
    xsmall: "h-3",
    small: "h-4",
    medium: "h-5",
    large: "h-6",
    xlarge: "h-9",
    fill: "w-full",
  });
