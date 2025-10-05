import { useState, useCallback, useEffect, useRef } from "react";
import { useMessage, useOn } from "@/aspects/message/messageContext";
import { useModels } from "@/aspects/models/Context";
import { PanelSection } from "@/aspects/panel/Section";
import { AuthVercel } from "../aspects/auth/Vercel";
import { Button } from "@wrkspc/ds";
import { Layout } from "./Layout";
import { useAppNavigation } from "./navigation";
import type { GatewaySecretState } from "./hooks/useGatewaySecretState";

interface AuthProps {
  gatewaySecretState: GatewaySecretState;
}

export function Auth({ gatewaySecretState }: AuthProps) {
  const { send } = useMessage();
  const { goBackOrIndex } = useAppNavigation();
  const { keyStatus, gatewayError } = useModels();
  const [openSignal, setOpenSignal] = useState(1);
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    send({ type: "lifecycle-webview-ready" });
  }, [send]);

  useOn(
    "auth-panel-open",
    () => {
      setOpenSignal((value) => value + 1);
    },
    [],
  );

  const handleNavigateBack = useCallback(() => {
    hasOpenedRef.current = false;
    goBackOrIndex();
  }, [goBackOrIndex]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        hasOpenedRef.current = true;
        return;
      }

      if (!hasOpenedRef.current) return;
      hasOpenedRef.current = false;
      goBackOrIndex();
    },
    [goBackOrIndex],
  );

  const handleSave = useCallback(
    (vercelGatewayKey: string) => {
      if (!vercelGatewayKey) return;
      send({
        type: "auth-vercel-gateway-set",
        payload: vercelGatewayKey,
      });
      send({ type: "models-data-get" });
    },
    [send],
  );

  const handleClear = useCallback(() => {
    send({ type: "auth-vercel-gateway-clear" });
    send({ type: "models-data-get" });
  }, [send]);

  const showAuthError =
    gatewaySecretState.hasKey && keyStatus.status === "error";
  const authErrorMessage = showAuthError
    ? keyStatus.message ??
      gatewayError ??
      "Failed to validate Vercel Gateway key. Please retry or update your credentials."
    : null;

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
            <Button style="label" color="secondary" onClick={handleNavigateBack}>
              Close
            </Button>
          </div>
        </PanelSection>

        <div className="px-5">
          <AuthVercel
            maskedKey={gatewaySecretState.maskedKey}
            hasKey={gatewaySecretState.hasKey}
            isResolved={gatewaySecretState.isResolved}
            readOnly={gatewaySecretState.readOnly}
            isSaving={gatewaySecretState.isSaving}
            errorMessage={authErrorMessage}
            validationStatus={keyStatus.status}
            validationCheckedAt={keyStatus.checkedAt ?? null}
            onSave={handleSave}
            onClear={handleClear}
            openSignal={openSignal}
            onOpenChange={handleOpenChange}
          />
        </div>
      </div>
    </Layout>
  );
}
