// import type { AvailableModel } from "@/aspects/model/Context";

export interface PricingInfoProps {
  // usage: any;
  // modelEntry: AvailableModel | null;
}

export function PromptRunPricingInfo(props: PricingInfoProps) {
  // const { usage, modelEntry } = props;
  // if (!usage || !modelEntry?.pricing) return null;

  // const inputPerToken = Number(modelEntry.pricing.input || 0);
  // const outputPerToken = Number((modelEntry.pricing as any).output || 0);
  // const inputTokens =
  //   usage.inputTokens ?? usage.input ?? usage.promptTokens ?? 0;
  // const outputTokens =
  //   usage.outputTokens ?? usage.output ?? usage.completionTokens ?? 0;
  // const inputCost = inputTokens * inputPerToken;
  // const outputCost = outputTokens * outputPerToken;
  // const total = inputCost + outputCost;

  return (
    <div className="text-xs">
      <div className="inline-flex items-center gap-2 px-2 py-1 border rounded">
        <span className="font-medium">Estimated cost:</span>
        {/* <span>${total.toFixed(6)}</span>
        <span>
          (in: {inputTokens} • ${inputCost.toFixed(6)}, out: {outputTokens} • $
          {outputCost.toFixed(6)})
        </span> */}
      </div>
    </div>
  );
}
