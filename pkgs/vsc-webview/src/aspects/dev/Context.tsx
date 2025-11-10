import { useAppState } from "../app/state/Context";
import { buildAppState } from "../app/state/state";
import { useListenMessage } from "../message/Context";

export function DevContextProvider(props: React.PropsWithChildren) {
  const { appState } = useAppState();

  useListenMessage(
    "dev-server-clear-app-state",
    () => appState.set(buildAppState()),
    [appState],
  );

  return <>{props.children}</>;
}
