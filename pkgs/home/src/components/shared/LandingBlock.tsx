import { textCn } from "@wrkspc/theme";
import { cn } from "crab";
import React from "react";

interface LandingBlockProps {
  children: React.ReactNode;
  src: string;
  alt: string;
  flipped?: boolean;
  inverse?: boolean;
}

export function LandingBlockLayout(props: LandingBlockProps) {
  return (
    <div
      className={cn(
        "w-full flex items-center py-24",
        props.flipped ? "flex-col-reverse" : "flex-col",
        props.inverse ? "bg-gray-900" : "bg-fade",
      )}
    >
      <div className={cn("max-w-7xl px-6 lg:px-8", props.flipped && "pt-24")}>
        {props.children}
      </div>

      <div className="relative overflow-hidden pt-16 flex flex-col justify-center">
        <div className="max-w-7xl lg:space-y-4">
          <img
            src={props.src}
            alt={props.alt}
            className="rounded-xl shadow-2xl ring-1 ring-white/10"
          />
          <div className="relative" aria-hidden="true">
            <div
              className={cn(
                "absolute -inset-x-20 bottom-0 bg-linear-to-t pt-[7%]",
                props.inverse ? "from-gray-900" : "from-white",
              )}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LandingBlockHeaderProps {
  label: string;
  labelColor: string;
  title: string;
  children: React.ReactNode;
  inverse?: boolean;
}

export function LandingBlockHeader(
  props: React.PropsWithChildren<LandingBlockHeaderProps>,
) {
  return (
    <div className={cn("max-w-2xl sm:text-center flex flex-col space-y-4")}>
      <p
        className={textCn({
          role: "label",
          size: "large",
          className: props.labelColor,
        })}
      >
        {props.label}
      </p>

      <h2
        className={textCn({
          role: "header",
          size: "large",
          inverse: !!props.inverse,
        })}
      >
        {props.title}
      </h2>
      <p
        className={textCn({
          role: "subheader",
          size: "large",
          color: "support",
          inverse: !!props.inverse,
        })}
      >
        {props.children}
      </p>
    </div>
  );
}
