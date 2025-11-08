import { State } from "enso";
import { DatasetSelectionComponent } from "../selection/Selection";
import { useDatasetDatasource } from "./Context";
import { DatasetDatasourceClientState } from "./clientState";

export namespace DatasetDatasourceCsvLoaded {
  export interface Props {
    csvState: State<DatasetDatasourceClientState.CsvLoaded>;
  }
}

export function DatasetDatasourceCsvLoaded(
  props: DatasetDatasourceCsvLoaded.Props,
) {
  const { datasetDatasource } = useDatasetDatasource();
  const { csvState } = props;

  const path = csvState.$.meta.$.path.useValue();
  const rows = csvState.$.meta.$.rows.useValue();

  const csvField = datasetDatasource.useSyncDatasetToDatasource(csvState);

  return (
    <div>
      <div className="min-w-0 flex-1 text-right">
        <span className="text-xs font-mono truncate block">{path}</span>
      </div>

      <DatasetSelectionComponent
        selectionField={csvField.$.selection}
        rows={rows}
      />
    </div>
  );
}
