import { useMessages } from "@/aspects/message/Context";
import { InputController } from "@wrkspc/ui";
import { Form, State } from "enso";
import { AuthAppState } from "../appState";
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
    <Form.Component
      form={vercelManager.form}
      onSubmit={async (values) => {
        await vercelManager.save(values.key);
      }}
    >
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800">Vercel Gateway API Key</h3>

        <div className="space-y-3">
          <InputController
            field={vercelManager.form.$.key}
            type="password"
            label="API Key"
            placeholder="Enter your Vercel Gateway API key..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              onClick={() => vercelManager.clearForm()}
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
