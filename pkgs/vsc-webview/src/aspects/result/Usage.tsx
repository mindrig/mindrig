import { ModelUsage } from "@wrkspc/core/model";
import { Block } from "@wrkspc/ui";
import { State } from "enso";
import { TinyFloat } from "tinyfloat";
import { useResult } from "./Context";

export namespace ResultUsage {
  export interface Props {
    usageState: State<ModelUsage> | State<ModelUsage | null> | State<null>;
  }
}

export function ResultUsage(props: ResultUsage.Props) {
  const { usageState } = props;
  const { useResultModel } = useResult();
  const model = useResultModel();
  const usage = usageState.useValue();

  if (!usage) return <Empty />;

  if (!(typeof usage.input === "number" && typeof usage.output === "number"))
    return <Empty />;

  const inputPrice =
    (model?.pricing?.input &&
      new TinyFloat(model.pricing.input).mul(usage.input)) ||
    null;
  const outputPrice =
    (model?.pricing?.output &&
      new TinyFloat(model.pricing.output).mul(usage.output)) ||
    null;
  const totalPrice = inputPrice && outputPrice && inputPrice.add(outputPrice);

  return (
    <Block border={[false, true, true]} pad>
      <TokensStat label="Input" price={inputPrice} tokens={usage.input} /> •{" "}
      <TokensStat label="Output" price={outputPrice} tokens={usage.output} />
      {totalPrice && (
        <>
          {" "}
          • Total: <Price price={totalPrice} />
        </>
      )}
    </Block>
  );
}

namespace TokensStat {
  export interface Props {
    price: TinyFloat | null;
    label: string;
    tokens: number;
  }
}

function TokensStat(props: TokensStat.Props) {
  const { price, label, tokens } = props;
  return (
    <span>
      {label}: {tokens} tok.
      {price && (
        <>
          {" "}
          (<Price price={price} />)
        </>
      )}
    </span>
  );
}

namespace Price {
  export interface Props {
    price: TinyFloat;
  }
}

function Price(props: Price.Props) {
  return <>est. ${props.price.toNumber().toFixed(6)}</>;
}

function Empty() {
  return <div>No usage data available.</div>;
}
