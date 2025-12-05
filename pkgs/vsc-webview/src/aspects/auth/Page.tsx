import { AppLayout } from "../app/Layout";
import { AuthGateway } from "./Gateway";

export function AuthPage() {
  return (
    <AppLayout>
      <AuthGateway />
    </AppLayout>
  );
}
