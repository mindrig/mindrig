import { Tag } from "@wrkspc/ui";
import { Field, State } from "enso";

export namespace CountTag {
  export interface Props extends Tag.Props {
    arrayState: State.Base<any[]> | Field.Base<any[]>;
  }
}

export function CountTag(props: CountTag.Props) {
  const { arrayState, ...tagProps } = props;
  const count = arrayState.useCompute((attachments) => attachments.length, []);
  return <Tag {...tagProps}>{count}</Tag>;
}
