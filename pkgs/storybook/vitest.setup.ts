import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/react-vite";
import * as projectAnnotations from "./src/preview";

setProjectAnnotations([
  a11yAddonAnnotations,
  // @ts-expect-error -- TODO: Figure out why this is needed and fix it properly.
  projectAnnotations,
]);
