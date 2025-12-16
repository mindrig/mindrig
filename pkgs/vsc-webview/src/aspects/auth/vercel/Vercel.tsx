import { Auth } from "@wrkspc/core/auth";
import { never } from "alwaysly";
import { State } from "enso";
import { AuthVercelForm } from "./Form";
import { AuthVercelManager } from "./Manager";
import { AuthVercelProfile } from "./Profile";

export namespace AuthVercel {
  export interface Props {
    authState: State<Auth>;
  }

  export interface FormValues {
    key: string;
  }
}

export function AuthVercel(props: AuthVercel.Props) {
  const { authState } = props;
  const vercelManager = AuthVercelManager.use({ authState });
  const discriminatedAppState = vercelManager.useDiscriminate();

  switch (discriminatedAppState.discriminator) {
    case "profile":
      return (
        <AuthVercelProfile
          authAppState={discriminatedAppState.state}
          vercelManager={vercelManager}
        />
      );

    case "form":
      return (
        <AuthVercelForm
          authAppState={discriminatedAppState.state}
          vercelManager={vercelManager}
        />
      );

    default:
      never(discriminatedAppState);
  }
}
