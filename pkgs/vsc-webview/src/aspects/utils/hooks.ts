import { DependencyList, useMemo } from "react";

export namespace useMemoWithProps {
  export type Callback<Props, Result> = (props: Props) => Result;

  export type PropsConstraint = Record<string, unknown>;
}

export function useMemoWithProps<
  Props extends useMemoWithProps.PropsConstraint,
  Result,
>(
  props: Props,
  callback: useMemoWithProps.Callback<Props, Result>,
  deps: DependencyList,
): Result {
  return useMemo(() => callback(props), [...deps, ...Object.values(props)]);
}
