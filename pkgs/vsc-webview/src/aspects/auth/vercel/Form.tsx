import { useMessages } from "@/aspects/message/Context";
import { InputController } from "@wrkspc/form";
import { Form } from "enso";
import { superstate } from "superstate";
import { AuthVercel } from "./Vercel";
import { AuthVercelStatechart } from "./statechart";

export namespace AuthVercelForm {
  export interface Props {
    form: Form<AuthVercel.FormValues>;
    statechart: AuthVercelStatechart.Instance;
    state: superstate.State<
      AuthVercelStatechart,
      "form" | "formSubmitting" | "formErrored"
    >;
  }

  export interface Values {
    key: string;
  }
}

export function AuthVercelForm(props: AuthVercelForm.Props) {
  const { form, statechart, state } = props;
  const { send } = useMessages();
  const submitting = form.submitting;

  return (
    <Form.Component
      form={form}
      onSubmit={async (values) => {
        statechart.send.submit();

        await new Promise<void>((resolve) => {
          statechart.once(["profile", "formErrored"], () => resolve());

          send({
            type: "auth-wv-vercel-gateway-set",
            payload: values.key,
          });
        });
      }}
    >
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800">Vercel Gateway API Key</h3>

        <div className="space-y-3">
          <InputController
            field={form.$.key}
            type="password"
            label="API Key"
            placeholder="Enter your Vercel Gateway API key..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            errors={state.context?.error}
            autoFocus
          />

          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save"}
            </button>

            <button
              onClick={() => send({ type: "auth-wv-vercel-gateway-clear" })}
              className="px-3 py-2 border border-red-600 text-red-600 text-sm rounded-lg hover:border-red-700 hover:text-red-700 transition-colors duration-200 bg-transparent"
              disabled={submitting}
            >
              Clear
            </button>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <a
              href="https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys%3Futm_source%3Dmindcontrol_vscode&title=Get+an+API+Key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Get an API key
            </a>
          </div>
        </div>
      </div>
    </Form.Component>
  );
}
