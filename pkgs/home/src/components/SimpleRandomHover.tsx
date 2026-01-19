import { useState } from "react";

const COLORS = [
	"bg-red-500",
	"bg-blue-500",
	"bg-green-500",
	"bg-yellow-500",
	"bg-purple-500",
	"bg-pink-500",
	"bg-indigo-500",
	"bg-teal-500",
	"bg-orange-500",
	"bg-cyan-500",
	"bg-emerald-500",
	"bg-violet-500",
	"bg-rose-500",
	"bg-sky-500",
	"bg-lime-500",
	"bg-amber-500",
	"bg-fuchsia-500",
	"bg-slate-500",
	"bg-gray-500",
	"bg-neutral-500",
];

interface SimpleRandomHoverProps {
	children?: React.ReactNode;
	className?: string;
}

export default function SimpleRandomHover({
	children,
	className = "",
}: SimpleRandomHoverProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [currentColor, setCurrentColor] = useState(COLORS[0]);

	const handleMouseEnter = () => {
		const randomIndex = Math.floor(Math.random() * COLORS.length);
		setCurrentColor(COLORS[randomIndex]);
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		setIsHovered(false);
	};

	const baseClasses =
		"w-full overflow-hidden rounded-lg shadow outline outline-1 outline-black/5 lg:rounded-bl-[2rem] transition-colors duration-200";
	const backgroundClass = isHovered ? currentColor : "bg-white";

	return (
		<div
			className={`${baseClasses} ${backgroundClass} ${className}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{children}
		</div>
	);
}
