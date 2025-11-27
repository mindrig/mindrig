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
  const datasetDatasource = DatasetDatasourceManager.use(datasourceField);
  const { pending, resolved } = datasetDatasource.useMeta();

  return (
    <DatasetDatasourceProvider datasetDatasource={datasetDatasource}>
      {resolved ? (
        <div>
          <DatasetDatasourceCsv />

          <Button
            size="xsmall"
            onClick={() => datasetDatasource.selectCsv()}
            isDisabled={pending}
          >
            Reload CSV
          </Button>

          {resolved && (
            <Button size="xsmall" onClick={() => datasetDatasource.clearCsv()}>
              Clear CSV
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p>Load a CSV file to use its data as the prompt variables.</p>

          <div>
            <Button
              size="xsmall"
              onClick={() => datasetDatasource.selectCsv()}
              isDisabled={pending}
            >
              Load CSV
            </Button>
          </div>
        </div>
      )}
    </DatasetDatasourceProvider>
  );
}
