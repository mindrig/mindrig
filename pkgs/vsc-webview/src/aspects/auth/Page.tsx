import { useAuth } from "@/aspects/auth/Context";
import { LayoutSection } from "@/aspects/layout/Section";
import { Auth } from "@wrkspc/core/auth";
import { Button } from "@wrkspc/ds";
import { useApp } from "../app/Context";
import { AppLayout } from "../app/Layout";
import { AuthVercel } from "./vercel/Vercel";

export function AuthPage() {
  const { auth } = useAuth();
  const { navigateBack } = useApp();

  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <LayoutSection bordered>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-gray-900">Account</h1>

              <p className="text-sm text-gray-500">
                Manage the Vercel Gateway credentials for this workspace.
              </p>
            </div>

            <Button style="label" color="secondary" onClick={navigateBack}>
              Close
            </Button>
          </div>
        </LayoutSection>

        <div className="px-5">
          <Content auth={auth} />
        </div>
      </div>
    </AppLayout>
  );
}

namespace Content {
  export interface Props {
    auth: Auth;
  }
}

function Content(props: Content.Props) {
  const { auth } = props;

  if (auth.gateway === undefined) return <div>Loading...</div>;

  switch (auth.gateway?.type) {
    default:
    case "vercel":
      return <AuthVercel gateway={auth.gateway} />;
  }
}
