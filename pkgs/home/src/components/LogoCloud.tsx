export default function LogoCloud() {
	return (
		<div className="bg-cream py-24 sm:py-32">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-12 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 sm:gap-y-14 lg:mx-0 lg:max-w-none lg:grid-cols-9">
					<img
						alt="Google"
						src="/model-logos/google.avif"
						width={38}
						height={38}
						className="col-span-2 max-h-12 rounded-full object-contain lg:col-span-1"
					/>
					<img
						alt="OpenAI"
						src="/model-logos/openai.avif"
						width={38}
						height={38}
						className="col-span-2  max-h-12 rounded-full object-contain  lg:col-span-1"
					/>
					<img
						alt="Anthropic"
						src="/model-logos/anthropic.avif"
						width={38}
						height={38}
						className="col-span-2 max-h-12 rounded-full object-contain lg:col-span-1"
					/>
					<img
						alt="Mistral"
						src="/model-logos/mistral.avif"
						width={38}
						height={38}
						className="col-span-2 max-h-12 rounded-full object-contain lg:col-span-1"
					/>
					<img
						alt="DeepSeek"
						src="/model-logos/deepseek.avif"
						width={38}
						height={38}
						className="col-span-2 max-h-12 rounded-full object-contain lg:col-span-1"
					/>
					<img
						alt="Z"
						src="/model-logos/zai.avif"
						width={38}
						height={38}
						className="col-span-2  max-h-12 rounded-full object-contain  lg:col-span-1"
					/>

					<img
						alt="KWAIpilot"
						src="/model-logos/kwaipilot.avif"
						width={38}
						height={38}
						className="col-span-2  max-h-12 rounded-full object-contain lg:col-span-1"
					/>

					<img
						alt="X"
						src="/model-logos/xai.avif"
						width={38}
						height={38}
						className="col-span-2  max-h-12 rounded-full object-contain lg:col-span-1"
					/>
					<img
						alt="MiniMax"
						src="/model-logos/minimax.avif"
						width={38}
						height={38}
						className="sm:block hidden col-span-2 max-h-12 rounded-full object-contain lg:col-span-1 lg:block"
					/>
				</div>
				<div className="mt-16 flex justify-center">
					<p className="relative rounded-full bg-gray-50 px-4 py-1.5 text-sm/6 text-gray-600 ring-1 ring-inset ring-gray-900/5">
						<span className="hidden md:inline">
							Connect your Vercel AI Gateway API key to access 100s of model
							providers.
						</span>
						<a
							href="https://vercel.com/ai-gateway/models"
							target="_blank"
							rel="noopener noreferrer"
							className="font-semibold text-blue-800 hover:text-indigo-500"
						>
							<span aria-hidden="true" className="absolute inset-0" /> View All
							Models <span aria-hidden="true">&rarr;</span>
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}
