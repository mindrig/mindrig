import { useAuth } from "./Context";
import { AuthVercel } from "./vercel/Vercel";

export function AuthGateway() {
  const { authState } = useAuth();
  const decomposedGateway = authState.$.gateway.useDecomposeNullish();

  if (decomposedGateway.value === undefined) return <div>Loading...</div>;

  switch (decomposedGateway.value?.type) {
    case "vercel":
    default:
      return <AuthVercel gatewayState={decomposedGateway.state} />;
  }
}
