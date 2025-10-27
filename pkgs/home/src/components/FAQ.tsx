import React from "react";

export function FAQ() {
  return (
    <div className="bg-white w-full flex flex-col items-center">
      <div className="max-w-7xl px-6 py-24 sm:pt-32 lg:px-8 lg:py-40">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5 space-y-4 ">
            <h2 className="text-4xl font-bold leading-10 tracking-tight">
              Got questions?
            </h2>

            <p id="contact" className="text-base leading-7 text-gray-600">
              If you have any other questions - please get in touch at{" "}
              <a
                href="mailto:hey@mindrig.dev"
                className="text-2xl font-bold text-blue-600 hover:text-blue-600"
              >
                hey@mindrig.dev
              </a>
            </p>
          </div>

          <div className="lg:col-span-7 pt-12 sm:pt0">
            <dl className="space-y-10">
              <Definition question="TODO: Question #1?">
                TODO: Answer to question #1. Lorem ipsum dolor sit amet,
                consectetur adipiscing elit. Maecenas sit amet nunc ac odio
                gravida sollicitudin vitae sed nisi. Integer ac leo tristique,
                aliquam leo sodales, venenatis nibh.
              </Definition>

              <Definition question="TODO: Question #2?">
                TODO: Answer to question #2. Lorem ipsum dolor sit amet,
                consectetur adipiscing elit. Maecenas sit amet nunc ac odio
                gravida sollicitudin vitae sed nisi. Integer ac leo tristique,
                aliquam leo sodales, venenatis nibh.
              </Definition>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DefinitionProps {
  question: string;
  id?: string;
}

function Definition(props: React.PropsWithChildren<DefinitionProps>) {
  return (
    <div>
      <dt id={props.id} className="text-base font-semibold leading-7">
        {props.question}
      </dt>

      <dd className=" leading-7 text-gray-600 prose">{props.children}</dd>
    </div>
  );
}
