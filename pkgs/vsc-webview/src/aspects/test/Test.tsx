import { Test } from "@wrkspc/core/test";
import { Block, Button, Checkbox, Tabs } from "@wrkspc/ui";
import { Field } from "enso";
import { Attachments } from "../attachment/Attachments";
import { Datasources } from "../datasource/Datasources";
import { DatasourcesPresenceTag } from "../datasource/DatasourcesPresenceTag";
import { LayoutSection } from "../layout/Section";
import { RunComponent } from "../run/Run";
import { CountTag } from "../ui/CountTag";
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
      <LayoutSection header="Test manually" style="fill" collapsible grow>
        <Block dir="y" pad={["small", "medium", false]}>
          <Tabs
            size="small"
            onChange={(id) => test.setTab(id)}
            items={[
              {
                id: "datasources",
                label: "Variables",
                extra: (
                  <DatasourcesPresenceTag
                    datasourcesField={testField.$.datasources}
                    size="xsmall"
                  />
                ),
                content: () => (
                  <Datasources datasourcesField={testField.$.datasources} />
                ),
              },
              {
                id: "attachments",
                label: "Attachments",
                extra: (
                  <CountTag
                    arrayState={testField.$.attachments}
                    size="xsmall"
                  />
                ),
                content: () => (
                  <Attachments attachmentsField={testField.$.attachments} />
                ),
              },
            ]}
            value={tab}
            collapsible={{ id: null }}
          />

          <Block align justify="between">
            <Block size="small" align>
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
            </Block>

            {run && <TestRunStarted run={run} />}
          </Block>
        </Block>

        {run && (
          <Block border="top" grow>
            <RunComponent run={run} />
          </Block>
        )}
      </LayoutSection>
    </>
  );
}
