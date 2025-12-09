import { createContext, useContext } from "react";
import { OnboardingManager } from "./Manager";

export namespace OnboardingContext {
  export interface Value {
    onboarding: OnboardingManager;
  }
}

export const OnboardingContext = createContext<
  OnboardingContext.Value | undefined
>(undefined);

export namespace OnboardingProvider {
  export interface Props {}
}

export function OnboardingProvider(
  props: React.PropsWithChildren<OnboardingProvider.Props>,
) {
  const onboarding = OnboardingManager.use();

  return (
    <OnboardingContext.Provider value={{ onboarding }}>
      {props.children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContext.Value {
  const value = useContext(OnboardingContext);
  if (!value)
    throw new Error("useOnboarding must be used within OnboardingProvider");
  return value;
}
