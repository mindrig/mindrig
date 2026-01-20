import { useState, useRef, useEffect } from "react";

interface DynamicHoverComponentProps {
	children?: React.ReactNode;
	className?: string;
}

export default function DynamicHoverComponent({
	children,
	className = "",
}: DynamicHoverComponentProps) {
	const [hoverColor, setHoverColor] = useState("rgb(239, 68, 68)"); // red-500 as default
	const elementRef = useRef<HTMLDivElement>(null);

	const generateRandomColor = () => {
		const colors = [
			"rgb(239, 68, 68)", // red-500
			"rgb(59, 130, 246)", // blue-500
			"rgb(34, 197, 94)", // green-500
			"rgb(234, 179, 8)", // yellow-500
			"rgb(168, 85, 247)", // purple-500
			"rgb(236, 72, 153)", // pink-500
			"rgb(99, 102, 241)", // indigo-500
			"rgb(20, 184, 166)", // teal-500
			"rgb(249, 115, 22)", // orange-500
			"rgb(6, 182, 212)", // cyan-500
			"rgb(16, 185, 129)", // emerald-500
			"rgb(139, 92, 246)", // violet-500
			"rgb(244, 63, 94)", // rose-500
			"rgb(14, 165, 233)", // sky-500
			"rgb(132, 204, 22)", // lime-500
			"rgb(245, 158, 11)", // amber-500
			"rgb(217, 70, 239)", // fuchsia-500
			"rgb(100, 116, 139)", // slate-500
		];

		const randomIndex = Math.floor(Math.random() * colors.length);
		return colors[randomIndex];
	};

	const handleMouseEnter = () => {
		const newColor = generateRandomColor();
		setHoverColor(newColor);

		if (elementRef.current) {
			elementRef.current.style.setProperty("--hover-color", newColor);
		}
	};

	useEffect(() => {
		if (elementRef.current) {
			elementRef.current.style.setProperty("--hover-color", hoverColor);
		}
	}, [hoverColor]);

	const baseClasses =
		"w-full overflow-hidden rounded-lg bg-white shadow outline outline-1 outline-black/5 lg:rounded-bl-[2rem] transition-colors duration-200";

	return (
		<div
			ref={elementRef}
			className={`${baseClasses} ${className}`}
			style={
				{
					"--hover-color": hoverColor,
				} as React.CSSProperties
			}
			onMouseEnter={handleMouseEnter}
			onMouseOver={(e) => {
				const target = e.currentTarget as HTMLElement;
				target.style.backgroundColor = "var(--hover-color)";
			}}
			onMouseLeave={(e) => {
				const target = e.currentTarget as HTMLElement;
				target.style.backgroundColor = "white";
			}}
		>
			{children}
		</div>
	);
}
