import * as projectAnnotations from "@/preview";
import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/react-vite";

setProjectAnnotations([
  a11yAddonAnnotations,
  // @ts-expect-error -- TODO: Figure out why this is needed and fix it properly.
  projectAnnotations,
]);
