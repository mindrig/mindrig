import { Test } from "@wrkspc/core/test";
import { Field } from "enso";
import { Attachments } from "../attachment/Attachments";
import { Datasources } from "../datasource/Datasources";
import { TestProvider } from "./Context";
import { TestRunComponent } from "./Run";

export { TestComponent as Test };

export namespace TestComponent {
  export interface Props {
    testField: Field<Test>;
  }
}

export function TestComponent(props: TestComponent.Props) {
  const { testField } = props;

  return (
    <TestProvider testField={testField}>
      <Attachments field={testField.$.attachments} />

      <Datasources field={testField.$.datasources} />

      <TestRunComponent />
    </TestProvider>
  );
}
