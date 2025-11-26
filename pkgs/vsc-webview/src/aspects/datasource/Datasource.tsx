import {
  buildDatasource,
  Datasource,
  DATASOURCE_TYPE_TITLES,
} from "@wrkspc/core/datasource";
import { Tabs } from "@wrkspc/ds";
import iconRegularInputText from "@wrkspc/icons/svg/regular/input-text.js";
import iconRegularTable from "@wrkspc/icons/svg/regular/table.js";
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
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-4 text-sm">
          <Tabs
            initial={type}
            value={type}
            onChange={(newType) => typeField.set(newType)}
            items={[
              {
                id: "manual",
                icon: iconRegularInputText,
                label: DATASOURCE_TYPE_TITLES.manual,
              },
              {
                id: "dataset",
                icon: iconRegularTable,
                label: DATASOURCE_TYPE_TITLES.dataset,
              },
            ]}
            size="small"
            style="inline"
          />
        </div>
      </div>

      {discriminated.discriminator === "dataset" ? (
        <DatasetDatasource datasourceField={discriminated.field} />
      ) : discriminated.discriminator === "manual" ? (
        <DatasourceManual datasourceField={discriminated.field} />
      ) : (
        never()
      )}
    </div>
  );
}
