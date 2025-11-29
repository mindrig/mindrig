import { textCn } from "@wrkspc/ds";
import { Icon } from "@wrkspc/icons";
import iconSolidCheckCircle from "@wrkspc/icons/svg/solid/check-circle.js";

export namespace DatasetSelectionAll {
  export interface Props {
    rows: number;
  }
}

export function DatasetSelectionAll(props: DatasetSelectionAll.Props) {
  const { rows } = props;
  return (
    <p className={textCn()}>
      <Icon id={iconSolidCheckCircle} size="xsmall" /> Use all CSV {rows} rows.
    </p>
  );
}
