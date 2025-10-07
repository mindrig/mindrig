import { useAuth } from "@/aspects/auth/Context";
import { PanelSection } from "@/aspects/panel/Section";
import { Auth } from "@wrkspc/auth";
import { Button } from "@wrkspc/ds";
import { AuthVercel } from "../aspects/auth/Vercel";
import { Layout } from "./Layout";

export function AuthPage() {
  const { auth, gateway } = useAuth();

  // const { send } = useMessage();
  // const { goBackOrIndex } = useAppNavigation();
  // const { keyStatus, gatewayError } = useModels();
  // const [openSignal, setOpenSignal] = useState(1);
  // const hasOpenedRef = useRef(false);

  // useOn(
  //   "auth-panel-open",
  //   () => {
  //     setOpenSignal((value) => value + 1);
  //   },
  //   [],
  // );

  // const handleNavigateBack = useCallback(() => {
  //   hasOpenedRef.current = false;
  //   goBackOrIndex();
  // }, [goBackOrIndex]);

  // const handleOpenChange = useCallback(
  //   (open: boolean) => {
  //     if (open) {
  //       hasOpenedRef.current = true;
  //       return;
  //     }

  //     if (!hasOpenedRef.current) return;
  //     hasOpenedRef.current = false;
  //     goBackOrIndex();
  //   },
  //   [goBackOrIndex],
  // );

  // const handleSave = useCallback(
  //   (vercelGatewayKey: string) => {
  //     if (!vercelGatewayKey) return;
  //     send({
  //       type: "auth-ext-vercel-gateway-set",
  //       payload: vercelGatewayKey,
  //     });
  //     send({ type: "models-data-get" });
  //   },
  //   [send],
  // );

  // const handleClear = useCallback(() => {
  //   send({ type: "auth-vercel-gateway-clear" });
  //   send({ type: "models-data-get" });
  // }, [send]);

  // const showAuthError =
  //   gatewaySecretState.hasKey && keyStatus.status === "error";
  // const authErrorMessage = showAuthError
  //   ? (keyStatus.message ??
  //     gatewayError ??
  //     "Failed to validate Vercel Gateway key. Please retry or update your credentials.")
  //   : null;

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <PanelSection bordered pinned={false}>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-gray-900">Account</h1>
              <p className="text-sm text-gray-500">
                Manage the Vercel Gateway credentials for this workspace.
              </p>
            </div>
            <Button
              style="label"
              color="secondary"
              // onClick={handleNavigateBack}
            >
              Close
            </Button>
          </div>
        </PanelSection>

        <div className="px-5">
          <Content auth={auth} />
        </div>
      </div>
    </Layout>
  );
}

namespace Content {
  export interface Props {
    auth: Auth;
  }
}

function Content(props: Content.Props) {
  const { auth } = props;

  switch (auth.gateway?.type) {
    case "vercel":
    default:
      return (
        <AuthVercel
          gateway={auth.gateway}
          // maskedKey={gatewaySecretState.maskedKey}
          // hasKey={gatewaySecretState.hasKey}
          // isResolved={gatewaySecretState.isResolved}
          // readOnly={gatewaySecretState.readOnly}
          // isSaving={gatewaySecretState.isSaving}
          // errorMessage={authErrorMessage}
          // validationStatus={keyStatus.status}
          // validationCheckedAt={keyStatus.checkedAt ?? null}
          // onSave={handleSave}
          // onClear={handleClear}
          // openSignal={openSignal}
          // onOpenChange={handleOpenChange}
        />
      );
  }
}
