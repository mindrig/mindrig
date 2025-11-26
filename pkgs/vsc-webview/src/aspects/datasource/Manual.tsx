import { DatasourceManual } from "@wrkspc/core/datasource";
import { Field } from "enso";
import { useAssessment } from "../assessment/Context";
import { DatasourceManualValues } from "./ManualValues";

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

  const valuesField = datasourceField.$.values.useCollection();
  const varsState = assessment.promptState.$.prompt.$.vars.useCollection();

  return (
    <div>
      {valuesField.map((valuesField) => (
        <DatasourceManualValues
          key={valuesField.id}
          varsState={varsState}
          valuesField={valuesField}
        />
      ))}
    </div>
  );
}
