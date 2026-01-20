import { Logotype } from "@wrkspc/logo";

export function Footer() {
	return (
		<footer className="bg-cream brightness-98 w-full px-4 py-12 flex justify-center border-t border-gray-300 ">
			<div className="w-full max-w-7xl flex justify-between items-center ">
				<div className="flex items-center gap-2">
					<a href="/">
						<Logotype />
					</a>
				</div>

				<p className="text-xs leading-5 ">
					&copy; {new Date().getFullYear()} Mind Rig, All rights reserved.
				</p>
			</div>
		</footer>
	);
}
