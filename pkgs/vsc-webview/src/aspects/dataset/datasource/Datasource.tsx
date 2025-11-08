import { DatasetDatasource } from "@wrkspc/core/dataset";
import { Button } from "@wrkspc/ds";
import { Field } from "enso";
import { DatasetDatasourceProvider } from "./Context";
import { DatasetDatasourceCsv } from "./Csv";
import { DatasetDatasourceManager } from "./Manager";

export { DatasetDatasourceComponent as DatasetDatasource };

export namespace DatasetDatasourceComponent {
  export interface Props {
    datasourceField: Field<DatasetDatasource>;
  }
}

export function DatasetDatasourceComponent(
  props: DatasetDatasourceComponent.Props,
) {
  const { datasourceField } = props;
  const dataset = DatasetDatasourceManager.use(datasourceField);

  const { loading, loaded } = dataset.useMeta();

  return (
    <DatasetDatasourceProvider datasetDatasource={dataset}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              size="xsmall"
              onClick={() => dataset.loadCsv()}
              isDisabled={loading}
            >
              {loaded ? "Reload CSV" : "Load CSV"}
            </Button>

            {loaded && (
              <Button size="xsmall" onClick={() => dataset.clearCsv()}>
                Clear CSV
              </Button>
            )}
          </div>
        </div>

        <DatasetDatasourceCsv />
      </div>
    </DatasetDatasourceProvider>
  );
}
