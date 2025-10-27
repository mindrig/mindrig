import { Logotype } from "@wrkspc/logo";

export function Footer() {
  return (
    <footer className="bg-gray-900 w-full px-4 py-12 flex justify-center ">
      <div className="w-full max-w-7xl flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <a href="/">
            <Logotype color="inverse" />
          </a>
        </div>

        <p className="text-xs leading-5 text-gray-300">
          &copy; {new Date().getFullYear()} Mind Rig, All rights reserved.
        </p>
      </div>
    </footer>
  );
}
