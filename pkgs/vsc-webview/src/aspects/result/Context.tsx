import { Model, resolveModel } from "@wrkspc/core/model";
import { Result } from "@wrkspc/core/result";
import { State } from "enso";
import { createContext, useCallback, useContext } from "react";
import { useModelsMap } from "../model/MapContext";

export namespace ResultContext {
  export interface Value {
    resultState: State<Result>;
    useResultModel: UseResultModel;
  }

  export type UseResultModel = () => Model | undefined | null;
}

export const ResultContext = createContext<ResultContext.Value | undefined>(
  undefined,
);

export namespace ResultProvider {
  export interface Props {
    state: State<Result>;
  }
}

export function ResultProvider(
  props: React.PropsWithChildren<ResultProvider.Props>,
) {
  const { state } = props;
  const { payload: modelsPayload } = useModelsMap();

  const useResultModel = useCallback<ResultContext.UseResultModel>(
    () =>
      state.$.init.$.setup.$.ref.useCompute(
        (ref) => resolveModel(ref, modelsPayload?.map),
        [modelsPayload?.map],
      ),
    [state, modelsPayload?.map],
  );

  return (
    <ResultContext.Provider value={{ resultState: state, useResultModel }}>
      {props.children}
    </ResultContext.Provider>
  );
}

export function useResult(): ResultContext.Value {
  const value = useContext(ResultContext);
  if (!value) throw new Error("useResult must be used within RunProvider");
  return value;
}
