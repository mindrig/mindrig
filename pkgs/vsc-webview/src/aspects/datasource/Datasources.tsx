import { Datasource } from "@wrkspc/core/datasource";
import iconRegularBracketsCurly from "@wrkspc/icons/svg/regular/brackets-curly.js";
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
    <LayoutSection
      header="Variables"
      icon={iconRegularBracketsCurly}
      style="tabs"
    >
      {field.map((datasourceField) => (
        <DatasourceComponent
          key={datasourceField.key}
          field={datasourceField}
        />
      ))}
    </LayoutSection>
  );
}
