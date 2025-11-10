import { ModelUsage } from "@wrkspc/core/model";
import { State } from "enso";
import { TinyFloat } from "tinyfloat";
import { useResult } from "./Context";

export namespace ResultUsage {
  export interface Props {
    state: State<ModelUsage> | State<ModelUsage | null> | State<null>;
  }
}

export function ResultUsage(props: ResultUsage.Props) {
  const { state } = props;
  const { useResultModel } = useResult();
  const model = useResultModel();

  const decomposedState = state.useDecomposeNullish();

  if (!decomposedState.value) {
    return <div>No usage data available.</div>;
  }

  const usage = decomposedState.state.useValue();

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
    <div className="text-xs">
      <div className="inline-flex items-center gap-2 px-2 py-1 border rounded">
        <TokensStat label="Input" price={inputPrice} tokens={usage.input} /> •{" "}
        <TokensStat label="Output" price={outputPrice} tokens={usage.output} />
        {totalPrice && (
          <>
            {" "}
            • Total: <Price price={totalPrice} />
          </>
        )}
      </div>
    </div>
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
