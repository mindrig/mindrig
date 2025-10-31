import { useMessages } from "@/aspects/message/Context";
import { Button, Errors } from "@wrkspc/ds";
import { superstate } from "superstate";
import { AuthVercelStatechart } from "./statechart";

export namespace AuthVercelProfile {
  export interface Props {
    statechart: AuthVercelStatechart.Instance;
    state: superstate.State<
      AuthVercelStatechart,
      "profile" | "profileValidating" | "profileErrored"
    >;
  }
}

export function AuthVercelProfile(props: AuthVercelProfile.Props) {
  const { statechart, state } = props;
  const { send } = useMessages();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm text-gray-600">Vercel Gateway API Key</p>
        <p className="font-mono text-gray-900">
          {state.context.maskedKey ?? "••••"}
        </p>
      </div>

      {state.name === "profileValidating" && (
        <p className="text-sm text-blue-600">Validating...</p>
      )}

      {state.name === "profileErrored" && (
        <div>
          <Errors errors={state.context.error} />

          <Button
            size="small"
            style="transparent"
            onClick={() => {
              // TODO: Add send function to state with all available events.
              statechart.send.revalidate("-> profileValidating", {
                maskedKey: state.context.maskedKey,
              });

              send({ type: "auth-client-vercel-gateway-revalidate" });
            }}
            isDisabled={!!statechart.in("profileValidating")}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => statechart.send.edit()}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          Update
        </button>

        <button
          onClick={() => statechart.send.clear()}
          className="px-3 py-2 text-sm border border-red-600 text-red-600 rounded-lg hover:border-red-700 hover:text-red-700 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
