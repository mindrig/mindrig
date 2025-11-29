import { CsvPreview } from "@/aspects/csv/Preview";
import { LayoutBlock } from "@/aspects/layout/Block";
import { Csv } from "@wrkspc/core/csv";
import iconRegularRefresh from "@wrkspc/icons/svg/regular/refresh.js";
import iconRegularTrashAlt from "@wrkspc/icons/svg/regular/trash-alt.js";
import { Button } from "@wrkspc/ui";
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
  const { pending, resolved } = datasetDatasource.useMeta();

  const csv = csvState.useValue();
  const csvField = datasetDatasource.useSyncCsvDataToDatasource(csvState);

  return (
    <div className="flex flex-col gap-3">
      <CsvPreview
        csv={csv}
        actions={
          <>
            <Button
              size="small"
              style="label"
              color="secondary"
              onClick={() => datasetDatasource.selectCsv()}
              isDisabled={pending}
              icon={iconRegularRefresh}
              title="Reload CSV"
            />

            {resolved && (
              <Button
                size="small"
                style="label"
                color="secondary"
                onClick={() => datasetDatasource.clearCsv()}
                icon={iconRegularTrashAlt}
                title="Clear CSV"
              />
            )}
          </>
        }
      />

      <LayoutBlock style="tabs" bordered divided>
        <DatasetSelectionComponent
          selectionField={csvField.$.selection}
          rows={csv.rows}
        />

        <DatasetDatasourceMapping csvField={csvField} csvState={csvState} />
      </LayoutBlock>
    </div>
  );
}
