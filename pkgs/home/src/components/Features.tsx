import { textCn } from "@wrkspc/theme";
import { cn } from "crab";
import React from "react";

export function Features() {
  return (
    <div className=" bg-white py-24 flex flex-col items-center w-full space-y-24 overflow-hidden ">
      <div className="max-w-2xl lg:text-center md:pb-12 overflow-hidden flex flex-col items-center px-6">
        <h2
          className={textCn({
            role: "header",
            size: "large",
          })}
        >
          TODO: Powerful AI Playground
          <br />
          Right in Your Code Editor
        </h2>
      </div>

      <div className="w-full max-w-4xl px-6 lg:px-8">TODO: Video here?</div>

      <Feature
        image="right"
        src="/landing/screenshot-1.png"
        alt="TODO: Screenshot alt"
      >
        <Header
          color="yellow"
          label="TODO: Label #1"
          header="TODO: Value Proposition #1"
        >
          TODO: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </Header>

        <Points color="yellow">
          <Point title="Point #1">
            TODO: Point #1 description. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit.
          </Point>

          <Point title="Point #2">
            TODO: Point #2 description. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit.
          </Point>

          <Point title="Point #3">
            TODO: Point #3 description. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit.
          </Point>
        </Points>
      </Feature>

      <Feature
        image="left"
        src="/landing/screenshot-2.png"
        alt="TODO: Screenshot alt"
      >
        <Header
          color="orange"
          label="TODO: Label #2"
          header="TODO: Value Proposition #2"
        >
          TODO: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </Header>

        <Points color="orange">
          <Point title="Point #1">
            TODO: Point #1 description. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit.
          </Point>

          <Point title="Point #2">
            TODO: Point #2 description. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit.
          </Point>

          <Point title="Point #3">
            TODO: Point #3 description. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit.
          </Point>
        </Points>
      </Feature>

      <Feature
        image="right"
        src="/landing/screenshot-3.png"
        alt="TODO: Screenshot alt"
      >
        <Header
          color="teal"
          label="TODO: Label #3"
          header="TODO: Value Proposition #3"
        >
          TODO: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </Header>

        <Points color="teal">
          <Point title="Point #1">
            TODO: Point #1 description. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit.
          </Point>

          <Point title="Point #2">
            TODO: Point #2 description. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit.
          </Point>

          <Point title="Point #3">
            TODO: Point #3 description. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit.
          </Point>
        </Points>
      </Feature>
    </div>
  );
}

interface FeatureProps {
  children: React.ReactNode;
  image: "left" | "right";
  src: string;
  alt: string;
}

function Feature(props: FeatureProps) {
  return (
    <div className="w-full max-w-7xl px-6 lg:px-8">
      <div className="grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:max-w-none lg:grid-cols-2">
        <div className="lg:pr-8 lg:pt-4 flex justify-center">
          <div className="lg:max-w-lg space-y-6">{props.children}</div>
        </div>

        <div
          className={cn(
            "flex items-start overflow-hidden md:overflow-visible 2xl:overflow-hidden",
            props.image === "left" && "justify-end lg:order-first",
          )}
        >
          <img
            src={props.src}
            alt={props.alt}
            className={cn(
              "w-3xl max-w-none rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-228",
              props.image === "left" &&
                "translate-x-72 md:translate-x-0 2xl:translate-x-36",

              props.src === "../../public/landing/collections.png" &&
                "-translate-x-40 md:translate-x-0 2xl:-translate-x-40",
            )}
          />
        </div>
      </div>
    </div>
  );
}

type Color = "yellow" | "orange" | "teal";

interface HeaderProps {
  color: Color;
  label: string;
  header: React.ReactNode;
}

function Header(props: React.PropsWithChildren<HeaderProps>) {
  return (
    <div className="space-y-3">
      <p
        className={textCn({
          role: "label",
          size: "large",
          className: cn(headerTitleCn({ color: props.color })),
        })}
      >
        {props.label}
      </p>

      <div className="space-y-2">
        <h2 className={textCn({ role: "header", size: "large" })}>
          {props.header}
        </h2>

        <p
          className={textCn({
            role: "subheader",
            size: "large",
            color: "support",
          })}
        >
          {props.children}
        </p>
      </div>
    </div>
  );
}

const headerTitleCn = cn<{
  color: Color;
}>().color("yellow", {
  yellow: "text-yellow-500",
  teal: "text-teal-500",
  orange: "text-orange-500",
});

function Points(
  props: React.PropsWithChildren<cn.Props<typeof coloredPointCn>>,
) {
  return (
    <ul className="space-y-4">
      {React.Children.map(props.children, (child) => (
        <li className="flex items-start gap-3">
          <div className={coloredPointCn(props)} />
          {child}
        </li>
      ))}
    </ul>
  );
}

const coloredPointCn = cn<{
  color: Color;
}>()
  .base("shrink-0 w-5 h-5 rounded-full relative top-[2px]")
  .color("yellow", {
    yellow: "bg-yellow-500",
    teal: "bg-teal-500",
    orange: "bg-orange-500",
  });

interface PointProps {
  title: string;
  description?: string;
}

function Point(props: React.PropsWithChildren<PointProps>) {
  return (
    <div className="space-y-1">
      <h3 className={textCn({ role: "header", size: "small" })}>
        {props.title}
      </h3>

      <p
        className={textCn({
          color: "support",
          className: "text-balance",
        })}
      >
        {props.description || props.children}
      </p>
    </div>
  );
}
