import { DatasourceManual } from "@wrkspc/core/datasource";

export namespace DatasourceManualPreview {
  export interface Props {
    datasource: DatasourceManual;
  }
}

export function DatasourceManualPreview(props: DatasourceManualPreview.Props) {
  const { datasource } = props;
  // Nothing to preview in manual datasource yet
  return null;
}
