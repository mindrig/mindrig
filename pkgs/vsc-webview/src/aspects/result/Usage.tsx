import { ModelUsage } from "@wrkspc/core/model";
import { Block, DescriptionList } from "@wrkspc/ui";
import { State } from "enso";
import { TinyFloat } from "tinyfloat";
import { useResult } from "./Context";
import { ResultMetaEmpty } from "./MetaEmpty";

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

  const totalTokens = usage.input + usage.output;

  const inputPrice =
    (model?.pricing?.input &&
      new TinyFloat(model.pricing.input).mul(usage.input)) ||
    null;
  const outputPrice =
    (model?.pricing?.output &&
      new TinyFloat(model.pricing.output).mul(usage.output)) ||
    null;
  const totalPrice = inputPrice && outputPrice && inputPrice.add(outputPrice);

  // TODO: Add missing usage information for models that report more than just
  // input/output tokens (e.g., reasoning tokens).

  return (
    <Block border size="xsmall" pad="y">
      <DescriptionList
        size="small"
        items={[
          {
            term: "Total",
            description: <TokensStat price={totalPrice} tokens={totalTokens} />,
          },
          {
            term: "Input",
            description: <TokensStat price={inputPrice} tokens={usage.input} />,
          },
          {
            term: "Output",
            description: (
              <TokensStat price={outputPrice} tokens={usage.output} />
            ),
          },
        ]}
      />
    </Block>
  );
}

namespace TokensStat {
  export interface Props {
    price: TinyFloat | null;
    tokens: number;
  }
}

function TokensStat(props: TokensStat.Props) {
  const { price, tokens } = props;
  return (
    <span>
      {tokens} tokens
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
  return <ResultMetaEmpty>No usage data available.</ResultMetaEmpty>;
}
