import { useAuth } from "./Context";
import { AuthVercel } from "./vercel/Vercel";

export function AuthGateway() {
  const { authState } = useAuth();

  const decomposedGateway = authState.$.gateway.useDecompose(
    (nextValue, prevValue) => !!nextValue === !!prevValue,
    [],
  );

  if (decomposedGateway.value === undefined) return <div>Loading...</div>;

  switch (decomposedGateway.value?.type) {
    default:
    case "vercel":
      return <AuthVercel gatewayState={decomposedGateway.state} />;
  }
}
