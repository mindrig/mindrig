import { buildDatasource, Datasource } from "@wrkspc/core/datasource";
import { SelectController } from "@wrkspc/ds";
import { never } from "alwaysly";
import { Field } from "enso";
import { DatasetDatasource } from "../dataset/datasource/Datasource";
import { DatasourceManual } from "./Manual";

export { DatasourceComponent as Datasource };

export namespace DatasourceComponent {
  export interface Props {
    field: Field<Datasource, "detachable">;
  }
}

export function DatasourceComponent(props: DatasourceComponent.Props) {
  const { field } = props;

  const discriminated = field.useDiscriminate("type");

  const typeField = field
    .useInto((datasource) => datasource.type, [])
    .from((type) => {
      // TODO: Save previous type state into ref so that UI browsing doesn't
      // lose data.
      return buildDatasource(type);
    }, []);
  const type = typeField.useValue();

  return (
    <div className="flex flex-col gap-3">
      <div className="max-w-40">
        <SelectController
          size="xsmall"
          field={typeField}
          label="Variables source"
          options={[
            { value: "manual", label: "Enter manually" },
            { value: "dataset", label: "Load CSV dataset" },
          ]}
        />
      </div>

      {/* <Tabs
        initial={type}
        value={type}
        onChange={(newType) => typeField.set(newType)}
        items={[
          {
            id: "manual",
            icon: iconRegularInputText,
            label: "Enter manually",
          },
          {
            id: "dataset",
            icon: iconRegularTable,
            label: "Use dataset",
          },
        ]}
        size="xsmall"
        style="inline"
      /> */}

      <div>
        {discriminated.discriminator === "dataset" ? (
          <DatasetDatasource datasourceField={discriminated.field} />
        ) : discriminated.discriminator === "manual" ? (
          <DatasourceManual datasourceField={discriminated.field} />
        ) : (
          never()
        )}
      </div>
    </div>
  );
}
