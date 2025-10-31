import { Test } from "@wrkspc/core/test";
import { Field } from "enso";
import { TestComponent } from "./Test";

export namespace Tests {
  export interface Props {
    field: Field<Test[]>;
  }
}

export function Tests(props: Tests.Props) {
  const field = props.field.useCollection();

  return (
    <div className="space-y-3">
      {field.map((testField) => (
        <TestComponent key={testField.key} field={testField} />
      ))}
    </div>
  );
}
