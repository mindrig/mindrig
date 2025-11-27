import { Test } from "@wrkspc/core/test";
import { Field } from "enso";
import { TestComponent } from "./Test";

export namespace Tests {
  export interface Props {
    testsField: Field<Test[]>;
  }
}

export function Tests(props: Tests.Props) {
  const testsField = props.testsField.useCollection();

  return (
    <>
      {testsField.map((testField) => (
        <TestComponent key={testField.id} testField={testField} />
      ))}
    </>
  );
}
