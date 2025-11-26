import { Datasource } from "@wrkspc/core/datasource";
import { Field } from "enso";
import { LayoutSection } from "../layout/Section";
import { DatasourceComponent } from "./Datasource";

export namespace Datasources {
  export interface Props {
    field: Field<Datasource[]>;
  }
}

export function Datasources(props: Datasources.Props) {
  const field = props.field.useCollection();

  return (
    <>
      <LayoutSection bordered>Datasource</LayoutSection>

      <LayoutSection>
        <div className="space-y-3">
          {field.map((datasourceField) => (
            <DatasourceComponent
              key={datasourceField.key}
              field={datasourceField}
            />
          ))}
        </div>
      </LayoutSection>
    </>
  );
}
