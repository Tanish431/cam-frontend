import { cn } from "@/lib/utils";

export function ReturnPill({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  if (value === undefined || isNaN(value)) {
    return <span className="text-muted-foreground text-xs font-mono">—</span>;
  }
  const pct = (value * 100).toFixed(2);
  const color =
    value > 0.005
      ? "text-green-400 bg-green-400/10"
      : value < -0.005
        ? "text-red-400 bg-red-400/10"
        : "text-muted-foreground bg-muted";
  return (
    <span
      className={cn(
        "text-xs font-mono px-1.5 py-0.5 rounded font-medium",
        color,
        className,
      )}
    >
      {value > 0 ? "+" : ""}
      {pct}%
    </span>
  );
}
