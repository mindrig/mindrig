import { cn } from "crab";
import { Logo, LogoColor, LogoProps, LogoSize } from "./Logo.js";

export interface LogotypeProps extends LogoProps {}

export function Logotype(props: LogotypeProps) {
  return (
    <div className="flex items-center gap-2">
      <Logo size={props.size} />
      <span className={logotypeCn(props)}>Mind Rig</span>
    </div>
  );
}

export const logotypeCn = cn<{ size: LogoSize; color: LogoColor }>()
  .base("font-semibold")
  .size("medium", {
    medium: "",
  })
  .color("main", {
    inverse: "text-white",
  });
