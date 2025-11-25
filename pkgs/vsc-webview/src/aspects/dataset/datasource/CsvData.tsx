import { Csv } from "@wrkspc/core/csv";
import { State } from "enso";
import { DatasetSelectionComponent } from "../selection/Selection";
import { useDatasetDatasource } from "./Context";
import { DatasetDatasourceMapping } from "./Mapping";

export namespace DatasetDatasourceCsvData {
  export interface Props {
    csvState: State<Csv>;
  }
}

export function DatasetDatasourceCsvData(
  props: DatasetDatasourceCsvData.Props,
) {
  const { csvState } = props;
  const { datasetDatasource } = useDatasetDatasource();

  const path = csvState.$.path.useValue();
  const rows = csvState.$.rows.useValue();

  const csvField = datasetDatasource.useSyncCsvDataToDatasource(csvState);

  return (
    <div>
      <div className="min-w-0 flex-1 text-right">
        <span className="text-xs font-mono truncate block">{path}</span>
      </div>

      <DatasetSelectionComponent
        selectionField={csvField.$.selection}
        rows={rows}
      />

      <DatasetDatasourceMapping csvField={csvField} csvState={csvState} />
    </div>
  );
}
