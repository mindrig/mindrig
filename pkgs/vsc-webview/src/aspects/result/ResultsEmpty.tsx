import { Block } from "@wrkspc/ui";
import { PropsWithChildren } from "react";
import { ResultEmpty } from "./Empty";

export namespace ResultsEmpty {
  export interface Props extends ResultEmpty.Props {}
}

export function ResultsEmpty(props: PropsWithChildren<ResultsEmpty.Props>) {
  return (
    <div>
      <Block pad="medium" align size="small">
        <ResultEmpty {...props} />
      </Block>
    </div>
  );
}
