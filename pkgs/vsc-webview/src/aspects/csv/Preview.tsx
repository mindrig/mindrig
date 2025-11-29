import { Csv } from "@wrkspc/core/csv";
import { Icon } from "@wrkspc/icons";
import iconRegularFileSpreadsheet from "@wrkspc/icons/svg/regular/file-spreadsheet.js";
import { ReactNode } from "react";
import { FilePreviewComponent } from "../file/Preview";

export namespace CsvPreview {
  export interface Props {
    csv: Csv;
    actions?: ReactNode | undefined;
  }
}

export function CsvPreview(props: CsvPreview.Props) {
  const { csv, actions } = props;
  return (
    <FilePreviewComponent
      icon={<Icon id={iconRegularFileSpreadsheet} color="detail" />}
      actions={actions}
      info={csv}
      meta={[`${csv.header.length} columns`, `${csv.rows} rows`]}
    />
  );
}
