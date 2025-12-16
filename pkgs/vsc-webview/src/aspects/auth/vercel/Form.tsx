import { Icon, textCn } from "@wrkspc/ds";
import iconRegularLightbulb from "@wrkspc/icons/svg/regular/lightbulb.js";
import { Block, Button, InputController } from "@wrkspc/ui";
import { Form, State } from "enso";
import { useEffect } from "react";
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
  const submitting = vercelManager.form.submitting;
  const dirty = vercelManager.form.useDirty();
  // TODO: Add missing useValid hook to Form in Enso
  const valid = vercelManager.form.field.useValid();
  const gatewayError = vercelManager.useError();

  useEffect(() => {
    const error = authAppState.$.error.value;
    if (!error) return;
    vercelManager.form.$.key.clearErrors();
    vercelManager.form.$.key.addError(error);
  }, [vercelManager, authAppState]);

  return (
    <AuthVercelLayout>
      <Form.Component
        form={vercelManager.form}
        onSubmit={async (values) => {
          await vercelManager.save(values.key);
        }}
      >
        <Block dir="y" pad background="primary" border>
          <Block dir="y" pad border>
            <Block dir="y" size="small">
              <Block size="xsmall" align>
                <Icon id={iconRegularLightbulb} size="small" color="support" />
                <h3
                  className={textCn({
                    bold: true,
                    size: "small",
                    color: "detail",
                  })}
                >
                  Why Vercel AI Gateway?
                </h3>
              </Block>

              <div
                className={textCn({
                  size: "small",
                  color: "detail",
                })}
              >
                <Block size="small" dir="y">
                  <p>
                    <a
                      href="https://vercel.com/ai-gateway"
                      className="text-link hover:text-link-hover"
                    >
                      Vercel AI Gateway
                    </a>{" "}
                    provides access to hundreds of AI models with a single API
                    key. It offers free quota, excellent DX and quick to set up.
                  </p>

                  <p>
                    More gateway options, as well as per-provider API keys
                    support, are{" "}
                    <a
                      href="https://github.com/mindrig/mindrig/issues?q=label%3A%22Gateway%22"
                      className="text-link hover:text-link-hover"
                    >
                      coming soon
                    </a>
                    !
                  </p>
                </Block>
              </div>
            </Block>

            <div>
              <Button
                href="https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys%3Futm_source%3Dmindcontrol_vscode&title=Get+an+API+Key"
                size="xsmall"
              >
                Get an API key
              </Button>
            </div>
          </Block>

          <Block dir="y" size="small">
            <InputController
              field={vercelManager.form.$.key}
              size="small"
              type="password"
              label="Vercel AI Gateway Key"
              placeholder="Enter your Vercel Gateway API key..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </Block>

          <Block align justify="between">
            <Block align>
              <Button size="small" type="submit">
                {submitting ? "Saving..." : "Save Key"}
              </Button>

              {gatewayError ? (
                <Button
                  onClick={() => {
                    vercelManager.clearForm();
                    vercelManager.clearKey();
                  }}
                  style="transparent"
                  color="danger"
                  size="small"
                >
                  Delete Key
                </Button>
              ) : (
                (dirty || !valid) && (
                  <Button
                    onClick={() => {
                      vercelManager.clearForm();
                    }}
                    size="small"
                    style="label"
                  >
                    Clear Form
                  </Button>
                )
              )}
            </Block>

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
