import { createContext, useContext } from "react";

export namespace TestContext {
  export interface Value {}
}

export const TestContext = createContext<TestContext.Value | undefined>(
  undefined,
);

export namespace TestProvider {
  export interface Props {
    // manager: AssessmentManager;
  }
}

export function TestProvider(
  props: React.PropsWithChildren<TestProvider.Props>,
) {
  const {} = props;
  return (
    <TestContext.Provider value={{}}>{props.children}</TestContext.Provider>
  );
}

export function useTest(): TestContext.Value {
  const value = useContext(TestContext);
  if (!value) throw new Error("useTest must be used within TestProvider");
  return value;
}
