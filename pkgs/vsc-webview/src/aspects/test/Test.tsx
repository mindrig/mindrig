import { Test } from "@wrkspc/core/test";
import { Field } from "enso";
import { Attachments } from "../attachment/Attachments";
import { Datasources } from "../datasource/Datasources";
import { TestProvider } from "./Context";
import { TestRun } from "./Run";

export { TestComponent as Test };

export namespace TestComponent {
  export interface Props {
    field: Field<Test>;
  }
}

export function TestComponent(props: TestComponent.Props) {
  const { field } = props;

  return (
    <TestProvider>
      <Attachments field={field.$.attachments} />

      <Datasources field={field.$.datasources} />

      <TestRun />
    </TestProvider>
  );
}
