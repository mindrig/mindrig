import { buildDatasource, Datasource } from "@wrkspc/core/datasource";
import { Tabs } from "@wrkspc/ds";
import iconRegularInputText from "@wrkspc/icons/svg/regular/input-text.js";
import iconRegularTable from "@wrkspc/icons/svg/regular/table.js";
import { never } from "alwaysly";
import { Field } from "enso";
import { DatasourceDataset } from "./Dataset";
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
    <div className="space-y-3">
      <div className="space-y-2">
        <h5 className="text-sm font-medium">Input Source</h5>
        <div className="flex items-center gap-4 text-sm">
          <Tabs
            initial={type}
            value={type}
            onChange={(newType) => typeField.set(newType)}
            items={[
              {
                id: "manual",
                icon: iconRegularInputText,
                label: "Manual",
              },
              {
                id: "dataset",
                icon: iconRegularTable,
                label: "Dataset",
              },
            ]}
            size="small"
            style="inline"
          />
        </div>
      </div>

      {discriminated.discriminator === "dataset" ? (
        <DatasourceDataset field={discriminated.field} />
      ) : discriminated.discriminator === "manual" ? (
        <DatasourceManual field={discriminated.field} />
      ) : (
        never()
      )}
    </div>
  );
}
