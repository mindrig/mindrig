import { textCn } from "@wrkspc/theme";
import { Block, Button } from "@wrkspc/ui";

export interface DownloadFormProps {
	inverse?: boolean;
}

export function DownloadForm(props: DownloadFormProps) {
	return (
		<Block
			justify
			align
			className="flex flex-col sm:flex-row sm:justify-center"
		>
			<Button
				color="cta"
				size="large"
				href="https://marketplace.visualstudio.com/items?itemName=mindrig.mindrig"
			>
				Install for VS Code
			</Button>

			<span
				className={`${textCn({ role: "label", size: "small", color: "detail" })} hidden sm:block`}
			>
				Or
			</span>

			<Button
				color="cta"
				size="large"
				href="https://open-vsx.org/extension/mindrig/mindrig"
			>
				Install for Cursor & Others.
			</Button>
		</Block>
	);
}
