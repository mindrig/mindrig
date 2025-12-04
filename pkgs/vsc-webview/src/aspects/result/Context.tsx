import { Model, resolveModel } from "@wrkspc/core/model";
import { Result } from "@wrkspc/core/result";
import { State } from "enso";
import { createContext, useCallback, useContext } from "react";
import { useAppState } from "../app/state/Context";
import { useModelsMap } from "../model/MapContext";
import { buildResultAppState, ResultAppState } from "./appState";

export namespace ResultContext {
  export interface Value {
    resultState: State<Result>;
    resultAppState: State<ResultAppState>;
    useResultModel: UseResultModel;
  }

  export type UseResultModel = () => Model | undefined | null;
}

export const ResultContext = createContext<ResultContext.Value | undefined>(
  undefined,
);

export namespace ResultProvider {
  export interface Props {
    resultState: State<Result>;
  }
}

export function ResultProvider(
  props: React.PropsWithChildren<ResultProvider.Props>,
) {
  const { resultState } = props;
  const { modelsPayload } = useModelsMap();
  const { appState } = useAppState();

  const useResultModel = useCallback<ResultContext.UseResultModel>(
    () =>
      resultState.$.init.$.setup.$.ref.useCompute(
        (ref) => resolveModel(ref, modelsPayload?.map),
        [modelsPayload?.map],
      ),
    [resultState, modelsPayload?.map],
  );

  const resultId = resultState.$.id.useValue();
  const resultAppState = appState.$.results
    .at(resultId)
    .pave(buildResultAppState());

  return (
    <ResultContext.Provider
      value={{ resultState, resultAppState, useResultModel }}
    >
      {props.children}
    </ResultContext.Provider>
  );
}

export function useResult(): ResultContext.Value {
  const value = useContext(ResultContext);
  if (!value) throw new Error("useResult must be used within ResultProvider");
  return value;
}
