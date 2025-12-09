import {
  buildOnboarding,
  buildOnboardingPlayground,
  Onboarding,
} from "@wrkspc/core/onboarding";
import { State } from "enso";
import { useStorePropState } from "../store/Context";
import { useMemoWithProps } from "../util/hooks";

export namespace OnboardingManager {
  export interface Props {
    onboardingStoreState: State<Onboarding | null | undefined>;
  }
}

export class OnboardingManager {
  static use() {
    const onboardingStoreState = useStorePropState(
      "global",
      "playground.onboarding",
    );

    const onboarding = useMemoWithProps(
      { onboardingStoreState },
      (props) => new OnboardingManager(props),
      [],
    );
    return onboarding;
  }

  #onboardingStoreState: State<Onboarding | null | undefined>;

  constructor(props: OnboardingManager.Props) {
    this.#onboardingStoreState = props.onboardingStoreState;
  }

  usePlaygroundWelcomeNotice(): Onboarding.NoticeState | undefined {
    return this.#onboardingStoreState.useCompute(
      (onboarding) =>
        onboarding || onboarding === null
          ? onboarding?.playground?.welcomeNotice || "not-seen"
          : undefined,
      [],
    );
  }

  setPlaygroundWelcomeNotice(seen: Onboarding.NoticeState) {
    this.#onboardingStoreState
      .pave(buildOnboarding())
      .$.playground.pave(buildOnboardingPlayground())
      .$.welcomeNotice.set(seen);
  }
}
