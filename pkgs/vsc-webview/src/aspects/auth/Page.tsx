import { LayoutSection } from "@/aspects/layout/Section";
import { Button } from "@wrkspc/ds";
import { useApp } from "../app/Context";
import { AppLayout } from "../app/Layout";
import { AuthGateway } from "./Gateway";

export function AuthPage() {
  const { navigateBack } = useApp();

  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <LayoutSection bordered>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-semibold text-gray-900">Account</h1>

            <Button style="label" color="secondary" onClick={navigateBack}>
              Close
            </Button>
          </div>
        </LayoutSection>

        <AuthGateway />
      </div>
    </AppLayout>
  );
}
