import { LandingBlockHeader, LandingBlockLayout } from "./shared/LandingBlock";

export function Integrate() {
  return (
    <LandingBlockLayout
      src="/landing/screenshot-install.png"
      alt="TODO: Screenshot alt"
      inverse
    >
      <LandingBlockHeader
        label="TODO: Easy Setup"
        labelColor="text-yellow-500"
        title="TODO: Get Set Up in Less Than 5 Minutes"
        inverse
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </LandingBlockHeader>
    </LandingBlockLayout>
  );
}
