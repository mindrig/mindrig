export function DatasourceMappingEntryRow(props: React.PropsWithChildren) {
  const { children } = props;
  return <div className="grid grid-cols-[8rem_1fr] gap-2">{children}</div>;
}
