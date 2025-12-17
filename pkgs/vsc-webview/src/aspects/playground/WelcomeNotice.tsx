import { Onboarding } from "@wrkspc/core/onboarding";
import { Block, Button, Checkbox, Notice } from "@wrkspc/ui";
import { useEffect, useState } from "react";
import { useOnboarding } from "../onboarding/Context";
import { OnboardingManager } from "../onboarding/Manager";

export function PlaygroundWelcomeNotice() {
  const { onboarding } = useOnboarding();
  const welcomeNotice = onboarding.usePlaygroundWelcomeNotice();

  if (welcomeNotice === undefined) return null;

  return <Content welcomeNotice={welcomeNotice} onboarding={onboarding} />;
}

namespace Content {
  export interface Props {
    welcomeNotice: Onboarding.NoticeState;
    onboarding: OnboardingManager;
  }
}

function Content(props: Content.Props) {
  const { welcomeNotice: welcomeNotice, onboarding } = props;

  const [dontShowAgain, setDontShowAgain] = useState(
    welcomeNotice !== "show-again",
  );
  const [forceShow, setForceShow] = useState(welcomeNotice !== "never-show");
  const [forceHide, setForceHide] = useState(false);

  useEffect(() => {
    onboarding.setPlaygroundWelcomeNotice(
      dontShowAgain ? "never-show" : "show-again",
    );
  }, [dontShowAgain, onboarding]);

  if (forceHide || (welcomeNotice && !forceShow)) return null;

  return (
    <Notice
      header="Welcome to Mind Rig!"
      onClose={() => {
        setForceHide(true);
        setForceShow(false);
      }}
    >
      <p>
        This is your interactive AI playground. Test a prompt against different
        models and values, inspect the request and response, and iterate on your
        prompts in real-time.
      </p>

      <Block size="small" justify="between" align>
        <Block size="small" align>
          <Button size="small" href="https://discord.gg/B2R9nHghq8">
            Join Discord
          </Button>

          <Button style="transparent" size="small" href="https://mindrig.ai">
            Learn More
          </Button>
        </Block>

        <Checkbox
          label="Don't show this again"
          value={dontShowAgain}
          size="small"
          onChange={(checked) => setDontShowAgain(checked)}
        />
      </Block>
    </Notice>
  );
}
