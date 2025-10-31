import { createContext, useContext } from "react";
import { AssessmentManager } from "./Manager";

export namespace AssessmentContext {
  export interface Value {
    assessment: AssessmentManager;
  }
}

export const AssessmentContext = createContext<
  AssessmentContext.Value | undefined
>(undefined);

export namespace AssessmentProvider {
  export interface Props {
    assessment: AssessmentManager;
  }
}

export function AssessmentProvider(
  props: React.PropsWithChildren<AssessmentProvider.Props>,
) {
  const { assessment } = props;
  return (
    <AssessmentContext.Provider value={{ assessment }}>
      {props.children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment(): AssessmentContext.Value {
  const value = useContext(AssessmentContext);
  if (!value)
    throw new Error("useAssessment must be used within AssessmentProvider");
  return value;
}
