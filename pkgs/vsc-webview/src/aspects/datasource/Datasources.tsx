import { Datasource } from "@wrkspc/core/datasource";
import { always } from "alwaysly";
import { Field } from "enso";
import { LayoutBlock } from "../layout/Block";
import { DatasourceComponent } from "./Datasource";

export namespace Datasources {
  export interface Props {
    datasourcesField: Field<Datasource[]>;
  }
}

export function Datasources(props: Datasources.Props) {
  // NOTE: Right now only single datasource is supported (and ensured).
  // So we just pick the first one until multiple are supported. It is this way
  // so we can easily extend it later without need for breaking schema changes.
  const decomposedDatasource = props.datasourcesField.at(0).decomposeNullish();
  always(decomposedDatasource.value);
  const datasourceField = decomposedDatasource.field;

  return (
    <LayoutBlock style="tabs">
      <DatasourceComponent key={datasourceField.key} field={datasourceField} />
    </LayoutBlock>
  );

  // TODO: Iterate over all datasources when multiple are supported.
  // const datasourcesField = props.datasourcesField.useCollection();
  // return (
  //   <>
  //     {datasourcesField.map((datasourceField) => (
  //       <DatasourceComponent
  //         key={datasourceField.key}
  //         field={datasourceField}
  //       />
  //     ))}
  //   </>
  // );
}
