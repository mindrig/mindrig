import { Datasource, DATASOURCE_TYPE_TITLES } from "@wrkspc/core/datasource";

export namespace DatasourcePreview {
  export interface Props {
    datasource: Datasource.V1;
  }
}

export function DatasourcePreview(props: DatasourcePreview.Props) {
  const { datasource } = props;

  return (
    <div>
      <div>{DATASOURCE_TYPE_TITLES[datasource.type]}</div>
    </div>
  );
}
