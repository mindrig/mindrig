import { useDatasetDatasource } from "./Context";
import { DatasetDatasourceCsvError } from "./CsvError";
import { DatasetDatasourceCsvLoaded } from "./CsvLoaded";

export function DatasetDatasourceCsv() {
  const { datasetDatasource } = useDatasetDatasource();
  const discriminatedCsv = datasetDatasource.useDiscriminatedCsv();

  switch (discriminatedCsv?.discriminator) {
    case "loaded":
      return <DatasetDatasourceCsvLoaded csvState={discriminatedCsv.state} />;

    case "error":
      return <DatasetDatasourceCsvError csvState={discriminatedCsv.state} />;

    case "loading":
    case null:
      return null;

    default:
      discriminatedCsv satisfies never;
  }
}
