import { Setup } from "@wrkspc/core/setup";
import { textCn } from "@wrkspc/ds";
import { Field } from "enso";

export namespace SetupsModelsLabels {
  export interface Props {
    setupsField: Field<Setup[]>;
  }
}

export function SetupsModelsLabels(props: SetupsModelsLabels.Props) {
  const { setupsField } = props;

  const label = setupsField.useCompute((setups) => {
    const labels: string[] = [];
    setups.forEach((setup) => {
      if (!setup.ref.modelId) return;
      labels.push(setup.ref.modelId);
    });
    return labels.join(", ");
  }, []);

  return (
    <span
      title={label}
      className={textCn({
        size: "xsmall",
        color: "detail",
        transform: "reset",
        truncate: true,
        className: "shrink",
      })}
    >
      {label}
    </span>
  );
}
