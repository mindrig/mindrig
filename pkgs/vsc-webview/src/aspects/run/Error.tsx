export namespace RunError {
  export interface Props {
    error: string;
  }
}

export function RunError(props: RunError.Props) {
  const { error } = props;

  return <div>Error: {error}</div>;
}
