export default function Bento() {
	return (
		<div className="bg-cream pt-24 sm:pt-32">
			<div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
				<h2 className="text-base/7 font-semibold text-blue-800">Test faster</h2>
				<p className="mt-2 max-w-lg text-pretty text-4xl font-semibold  text-gray-900 sm:text-5xl">
					80% of what you get with formal evaluation tools, 5% of the setup.
				</p>
				<div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
					<div className="flex p-px lg:col-span-4">
						<div className="w-full overflow-hidden rounded-lg bg-white shadow outline outline-1 outline-black/5 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem]">
							<div className="p-10">
								<h3 className="text-sm/4 font-semibold text-gray-500">
									Languages
								</h3>
								<p className="mt-2 text-lg font-medium tracking-tight text-gray-900">
									Supports Ruby, PHP, Go, C# and Java in addition to
									Javascript/Typescript and Python
								</p>
								<p className="mt-2 max-w-lg text-sm/6 text-gray-600">
									Test prompts in whatever language your want.
								</p>
							</div>
						</div>
					</div>
					<div className="flex p-px lg:col-span-2">
						<div className="w-full overflow-hidden rounded-lg bg-white shadow outline outline-1 outline-black/5 lg:rounded-tr-[2rem]">
							<div className="p-10">
								<h3 className="text-sm/4 font-semibold text-gray-500">
									Security
								</h3>
								<p className="mt-2 text-lg font-medium tracking-tight text-gray-900">
									Free and Open-source
								</p>
								<p className="mt-2 max-w-lg text-sm/6 text-gray-600">
									Bring your own API keys—we never touch your data.
								</p>
							</div>
						</div>
					</div>
					<div className="flex p-px lg:col-span-2 ">
						<div className="w-full overflow-hidden rounded-lg bg-white shadow outline outline-1 outline-black/5 lg:rounded-bl-[2rem] hover:bg-yellow-100 ">
							<div className="p-10">
								<h3 className="text-sm/4 font-semibold text-gray-500">
									Design
								</h3>
								<p className="mt-2 text-lg font-medium tracking-tight text-gray-900">
									Matches your editor's colour theme
								</p>
								<p className="mt-2 max-w-lg text-sm/6 text-gray-600">
									Mind Rig stays out of your way visually.
								</p>
							</div>
						</div>
					</div>
					<div className="flex p-px lg:col-span-4">
						<div className="w-full overflow-hidden rounded-lg bg-white shadow outline outline-1 outline-black/5 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]">
							<div className="p-10">
								<h3 className="text-sm/4 font-semibold text-gray-500">
									Support
								</h3>
								<p className="mt-2 text-lg font-medium tracking-tight text-gray-900">
									We also have a{" "}
									<a
										href="https://discord.gg/B2R9nHghq8"
										className="text-blue-800 hover:text-blue-900 underline"
									>
										Discord community
									</a>{" "}
									if you need any help getting set up.
								</p>
								<p className="mt-2 max-w-lg text-sm/6 text-gray-600">
									Get help in minutes, not days. Ask questions, share feedback,
									or see how others are using Mind Rig in production.{" "}
									<strong>hey@mindrig.io</strong>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
