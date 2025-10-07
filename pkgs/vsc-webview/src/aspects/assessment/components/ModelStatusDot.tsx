export type ModelStatus = "loading" | "ok" | "error";

const STATUS_COLOR: Record<ModelStatus, string> = {
  loading: "#9CA3AF",
  ok: "#22C55E",
  error: "#EF4444",
};

const STATUS_LABEL: Record<ModelStatus, string> = {
  loading: "Models are loading",
  ok: "Models are ready",
  error: "Model loading failed",
};

export interface ModelStatusDotProps {
  status: ModelStatus;
  className?: string;
}

export function ModelStatusDot({ status, className }: ModelStatusDotProps) {
  const color = STATUS_COLOR[status];
  const label = STATUS_LABEL[status];
  const pulseClass = status === "loading" ? " animate-pulse" : "";
  const classes = `inline-block h-2.5 w-2.5 rounded-full${pulseClass}`;

  return (
    <span
      role="status"
      aria-label={label}
      data-status={status}
      className={`inline-flex items-center ${className ?? ""}`.trim()}
    >
      <span className={classes} style={{ backgroundColor: color }} />
    </span>
  );
}
