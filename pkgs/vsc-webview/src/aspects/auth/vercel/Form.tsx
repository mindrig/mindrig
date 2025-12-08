import { useMessages } from "@/aspects/message/Context";
import { Block, Button, InputController } from "@wrkspc/ui";
import { Form, State } from "enso";
import { AuthAppState } from "../appState";
import { AuthVercelLayout } from "./Layout";
import { AuthVercelManager } from "./Manager";

export namespace AuthVercelForm {
  export interface Props {
    authAppState: State<AuthAppState.Form>;
    vercelManager: AuthVercelManager;
  }

  export interface Values {
    key: string;
  }
}

export function AuthVercelForm(props: AuthVercelForm.Props) {
  const { authAppState, vercelManager } = props;
  const { sendMessage } = useMessages();
  const submitting = vercelManager.form.submitting;

  return (
    <AuthVercelLayout>
      <Form.Component
        form={vercelManager.form}
        onSubmit={async (values) => {
          await vercelManager.save(values.key);
        }}
      >
        <Block dir="y" pad background="primary" border>
          <Block dir="y" size="small">
            <InputController
              field={vercelManager.form.$.key}
              size="small"
              type="password"
              label="API Key"
              placeholder="Enter your Vercel Gateway API key..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </Block>

          <Block align justify="between">
            <Button size="small" type="submit">
              {submitting ? "Saving..." : "Save"}
            </Button>

            <div>
              <Button
                href="https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys%3Futm_source%3Dmindcontrol_vscode&title=Get+an+API+Key"
                size="small"
                color="secondary"
                style="label"
              >
                Get an API key
              </Button>
            </div>
          </Block>
        </Block>
      </Form.Component>
    </AuthVercelLayout>
  );
}
