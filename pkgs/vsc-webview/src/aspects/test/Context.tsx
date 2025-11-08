import { createContext, useContext } from "react";
import { TestManager } from "./Manager";

export namespace TestContext {
  export interface Value {
    test: TestManager;
  }
}

export const TestContext = createContext<TestContext.Value | undefined>(
  undefined,
);

export function TestProvider(
  props: React.PropsWithChildren<TestManager.UseProps>,
) {
  const test = TestManager.use(props);

  return (
    <TestContext.Provider value={{ test }}>
      {props.children}
    </TestContext.Provider>
  );
}

export function useTest(): TestContext.Value {
  const value = useContext(TestContext);
  if (!value) throw new Error("useTest must be used within TestProvider");
  return value;
}
