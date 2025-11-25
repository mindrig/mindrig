import { useDatasetDatasource } from "./Context";
import { DatasetDatasourceCsvError } from "./CsvError";
import { DatasetDatasourceCsvLoaded } from "./CsvLoaded";

export function DatasetDatasourceCsv() {
  const { datasetDatasource } = useDatasetDatasource();
  const csvRequestState = datasetDatasource.useCsvRequestState();
  const discriminatedCsvRequestState =
    csvRequestState.useDiscriminate("status");

  switch (discriminatedCsvRequestState?.discriminator) {
    case "ok":
      return (
        <DatasetDatasourceCsvLoaded
          pathState={discriminatedCsvRequestState.state.$.path}
        />
      );

    case "error":
      return (
        <DatasetDatasourceCsvError
          errorState={discriminatedCsvRequestState.state.$.error}
        />
      );

    case "pending":
    case undefined:
      return null;

    default:
      discriminatedCsvRequestState satisfies never;
  }
}
