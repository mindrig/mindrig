import { AuthProvider } from "@/aspects/auth/Context";
import { MessagesProvider } from "@/aspects/message/Context";
import { defaultPageHref, pageHrefs } from "@/aspects/page/route";
import { VscProvider } from "@/aspects/vsc/Context";
import { Page } from "@wrkspc/core/page";
import React, { useCallback } from "react";
import { NavigateOptions, useNavigate } from "react-router-dom";
import { ClientStateProvider } from "../client/StateContext";
import { CsvsProvider } from "../csv/CsvsContext";
import { DevContextProvider } from "../dev/Context";
import { ModelsMapProvider } from "../model/MapContext";
import { OnboardingProvider } from "../onboarding/Context";
import { RunsProvider } from "../run/RunsContext";
import { AppStateProvider } from "./state/Context";

export function AppContext(props: React.PropsWithChildren) {
  return (
    <VscProvider>
      <MessagesProvider>
        <ClientStateProvider>
          <AppStateProvider>
            <AuthProvider>
              <ModelsMapProvider>
                <OnboardingProvider>
                  <RunsProvider>
                    <CsvsProvider>
                      <DevContextProvider>{props.children}</DevContextProvider>
                    </CsvsProvider>
                  </RunsProvider>
                </OnboardingProvider>
              </ModelsMapProvider>
            </AuthProvider>
          </AppStateProvider>
        </ClientStateProvider>
      </MessagesProvider>
    </VscProvider>
  );
}

export namespace UseApp {
  export interface Result {
    navigateTo: NavigateTo;
    navigateBack: NavigateBack;
  }

  export type NavigateTo = (page: Page, options?: NavigateOptions) => void;

  export type NavigateBack = () => void;
}

export function useApp(): UseApp.Result {
  const navigate = useNavigate();

  const navigateTo = useCallback<UseApp.NavigateTo>(
    (page, options) => navigate(pageHrefs[page.type](), options),
    [navigate],
  );

  const navigateBack = useCallback(() => {
    if (getHistoryIndex() > 0) return navigate(-1);
    navigate(defaultPageHref(), { replace: true });
  }, [navigate]);

  return {
    navigateTo,
    navigateBack,
  };
}

function getHistoryIndex(): number {
  const state = window.history?.state;
  if (!state) return 0;
  if (typeof state.idx === "number") return state.idx;
  if (typeof state.index === "number") return state.index;
  return 0;
}
