import { Versioned } from "../versioned";

export interface Onboarding extends Versioned<1> {
  playground?: Onboarding.Playground;
}

export namespace Onboarding {
  export interface Playground extends Versioned<1> {
    welcomeNotice?: NoticeState;
  }

  export type NoticeState = "not-seen" | "show-again" | "never-show";
}

export function buildOnboarding(): Onboarding {
  return {
    v: 1,
  };
}

export function buildOnboardingPlayground(): Onboarding.Playground {
  return {
    v: 1,
  };
}
