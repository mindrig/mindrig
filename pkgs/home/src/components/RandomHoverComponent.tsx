import { useState } from "react";

const HOVER_COLORS = [
	"hover:bg-red-500",
	"hover:bg-blue-500",
	"hover:bg-green-500",
	"hover:bg-yellow-500",
	"hover:bg-purple-500",
	"hover:bg-pink-500",
	"hover:bg-indigo-500",
	"hover:bg-teal-500",
	"hover:bg-orange-500",
	"hover:bg-cyan-500",
	"hover:bg-emerald-500",
	"hover:bg-violet-500",
	"hover:bg-rose-500",
	"hover:bg-sky-500",
	"hover:bg-lime-500",
	"hover:bg-amber-500",
	"hover:bg-fuchsia-500",
	"hover:bg-slate-500",
];

interface RandomHoverComponentProps {
	children?: React.ReactNode;
	className?: string;
}

export default function RandomHoverComponent({
	children,
	className = "",
}: RandomHoverComponentProps) {
	const [currentHoverClass, setCurrentHoverClass] = useState(HOVER_COLORS[0]);

	const handleMouseEnter = () => {
		const randomIndex = Math.floor(Math.random() * HOVER_COLORS.length);
		setCurrentHoverClass(HOVER_COLORS[randomIndex]);
	};

	const baseClasses =
		"w-full overflow-hidden rounded-lg bg-white shadow outline outline-1 outline-black/5 lg:rounded-bl-[2rem] transition-colors duration-200";

	return (
		<div
			className={`${baseClasses} ${currentHoverClass} ${className}`}
			onMouseEnter={handleMouseEnter}
		>
			{children}
		</div>
	);
}
