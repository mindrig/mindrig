import { Test } from "@wrkspc/core/test";
import { Button, Checkbox, Tabs } from "@wrkspc/ui";
import { Field } from "enso";
import { Attachments } from "../attachment/Attachments";
import { Datasources } from "../datasource/Datasources";
import { LayoutInner } from "../layout/Inner";
import { LayoutSection } from "../layout/Section";
import { RunComponent } from "../run/Run";
import { useTest } from "./Context";
import { TestRunStarted } from "./RunStarted";

export { TestComponent as Test };

export namespace TestComponent {
  export interface Props {
    testField: Field<Test>;
  }
}

export function TestComponent(props: TestComponent.Props) {
  const { testField } = props;
  const { test } = useTest();
  const tab = test.useTab();
  const running = test.useRunning();
  const run = test.useRun();
  const streaming = test.useStreaming();

  return (
    <>
      <LayoutSection header="Test manually" style="fill" collapsible>
        <LayoutInner pad="x">
          <Tabs
            size="small"
            onChange={(id) => test.setTab(id)}
            items={[
              {
                id: "datasources",
                label: "Variables",
                content: () => (
                  <Datasources datasourcesField={testField.$.datasources} />
                ),
              },
              {
                id: "attachments",
                label: "Attachments",
                content: () => (
                  <Attachments attachmentsField={testField.$.attachments} />
                ),
              },
            ]}
            value={tab}
            collapsible={{ id: null }}
          />

          <LayoutInner pad="y">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="small"
                  onClick={() =>
                    run && running ? run.stopRun() : test.startRun()
                  }
                  style={run && running ? "transparent" : "solid"}
                  isDisabled={!run && running}
                >
                  {running ? "Stop Run" : "Run Prompt"}
                </Button>

                <Checkbox
                  label="Stream output"
                  value={streaming}
                  onChange={(enabled) => test.setStreaming(enabled)}
                  size="small"
                />
              </div>

              {run && <TestRunStarted run={run} />}
            </div>
          </LayoutInner>
        </LayoutInner>

        {run && (
          <LayoutInner divide="top">
            <RunComponent run={run} />
          </LayoutInner>
        )}
      </LayoutSection>
    </>
  );
}
