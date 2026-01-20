import RandomHoverComponent from "./RandomHoverComponent";
import DynamicHoverComponent from "./DynamicHoverComponent";
import SimpleRandomHover from "./SimpleRandomHover";

export default function HoverExample() {
	return (
		<div className="p-8 space-y-8">
			<h1 className="text-2xl font-bold mb-6">Random Hover Color Examples</h1>

			{/* Example 1: Predefined Tailwind Colors */}
			<div>
				<h2 className="text-lg font-semibold mb-2">
					1. Predefined Tailwind Colors
				</h2>
				<RandomHoverComponent className="p-6">
					<p className="text-gray-800">
						Hover over me! I'll change to a random predefined Tailwind color
						each time.
					</p>
				</RandomHoverComponent>
			</div>

			{/* Example 2: Dynamic CSS Variables */}
			<div>
				<h2 className="text-lg font-semibold mb-2">2. Dynamic CSS Variables</h2>
				<DynamicHoverComponent className="p-6">
					<p className="text-gray-800">
						Hover over me! I use CSS variables for more flexible color changes.
					</p>
				</DynamicHoverComponent>
			</div>

			{/* Example 3: Simple Hook-Based */}
			<div>
				<h2 className="text-lg font-semibold mb-2">
					3. Simple Hook-Based (Recommended)
				</h2>
				<SimpleRandomHover className="p-6">
					<p className="text-gray-800">
						Hover over me! I'm the simplest implementation and works great.
					</p>
				</SimpleRandomHover>
			</div>

			{/* Example 4: Multiple components */}
			<div>
				<h2 className="text-lg font-semibold mb-2">4. Multiple Components</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<SimpleRandomHover className="p-4">
						<h3 className="font-medium mb-2">Card 1</h3>
						<p className="text-sm text-gray-600">
							Each card changes independently
						</p>
					</SimpleRandomHover>
					<SimpleRandomHover className="p-4">
						<h3 className="font-medium mb-2">Card 2</h3>
						<p className="text-sm text-gray-600">Try hovering over both!</p>
					</SimpleRandomHover>
				</div>
			</div>

			{/* Example 5: With custom content */}
			<div>
				<h2 className="text-lg font-semibold mb-2">5. With Custom Content</h2>
				<SimpleRandomHover className="p-6">
					<div className="flex items-center space-x-4">
						<div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
							<span className="text-xl">🎨</span>
						</div>
						<div>
							<h3 className="font-semibold text-lg">Color Changer</h3>
							<p className="text-gray-600">Hover to see the magic happen!</p>
						</div>
					</div>
				</SimpleRandomHover>
			</div>
		</div>
	);
}
