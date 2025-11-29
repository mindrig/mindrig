import { textCn } from "@wrkspc/ds";
import { DatasourceMappingEntryRow } from "./MappingEntryRow";

export namespace DatasourceMappingEntry {
  export interface Props {
    exp: string;
  }
}

export function DatasourceMappingEntry(
  props: React.PropsWithChildren<DatasourceMappingEntry.Props>,
) {
  const { exp, children } = props;
  return (
    <DatasourceMappingEntryRow>
      <div className="truncate flex items-center" title={exp}>
        <span className={textCn({ role: "label", size: "small", mono: true })}>
          {exp}:
        </span>
      </div>

      {children}
    </DatasourceMappingEntryRow>
  );
}
