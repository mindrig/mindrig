import { DatasourceManual } from "@wrkspc/core/datasource";
import { Field } from "enso";
import { useAssessment } from "../assessment/Context";
import { DatasourceManualVar } from "./ManualVar";

export { DatasourceManualComponent as DatasourceManual };

export namespace DatasourceManualComponent {
  export interface Props {
    datasourceField: Field<DatasourceManual>;
  }
}

export function DatasourceManualComponent(
  props: DatasourceManualComponent.Props,
) {
  const { datasourceField } = props;
  const { assessment } = useAssessment();

  const varsState = assessment.promptState.$.vars.useCollection();

  return (
    <div>
      {varsState.map((varState) => (
        <DatasourceManualVar
          key={varState.id}
          varState={varState}
          valuesField={datasourceField.$.values}
        />
      ))}
    </div>
  );
}
