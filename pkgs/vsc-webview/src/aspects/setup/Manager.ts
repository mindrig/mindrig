// oxlint-disable react-hooks/rules-of-hooks
import { Setup } from "@wrkspc/core/setup";
import { Field, State } from "enso";
import { useAppState } from "../app/state/Context";
import { useMemoWithProps } from "../util/hooks";
import {
  buildSetupAppState,
  DEFAULT_SETUP_SETTINGS_TAB,
  SetupAppState,
} from "./appState";

export namespace SetupManager {
  export interface UseProps {
    setupField: Field<Setup, "detachable">;
  }

  export interface Props {
    setupField: Field<Setup, "detachable">;
    setupAppState: State<SetupAppState>;
  }
}

export class SetupManager {
  static use(props: SetupManager.UseProps) {
    const { setupField } = props;

    const setupId = setupField.$.id.useValue();
    const { appState } = useAppState();
    const setupAppState = appState.$.setups
      .at(setupId)
      .pave(buildSetupAppState());

    const test = useMemoWithProps(
      { setupField, setupAppState },
      (props) => new SetupManager(props),
      [],
    );

    return test;
  }

  #setupField;
  #setupAppstate;

  constructor(props: SetupManager.Props) {
    this.#setupField = props.setupField;
    this.#setupAppstate = props.setupAppState;
  }

  useShowSettings() {
    return this.#setupAppstate.$.settingsTab.useCompute((tab) => !!tab, []);
  }

  useSettingsTab() {
    return this.#setupAppstate.$.settingsTab.useValue();
  }

  hideSettings() {
    this.#setupAppstate.$.settingsTab.set(null);
  }

  showSettings(tab: SetupAppState.SettingsTab = DEFAULT_SETUP_SETTINGS_TAB) {
    this.#setupAppstate.$.settingsTab.set(tab);
  }
}
