import { cn } from "@/lib/utils";

const REGIME_STYLES: Record<string, string> = {
  "risk-on": "bg-green-500/10  text-green-400  border-green-500/20",
  "mild stress": "bg-blue-500/10   text-blue-400   border-blue-500/20",
  divergence: "bg-amber-500/10  text-amber-400  border-amber-500/20",
  "regime break": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "systemic stress": "bg-red-500/10   text-red-400    border-red-500/20",
  transition: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const REGIME_DOTS: Record<string, string> = {
  "risk-on": "bg-green-400",
  "mild stress": "bg-blue-400",
  divergence: "bg-amber-400",
  "regime break": "bg-orange-400",
  "systemic stress": "bg-red-400",
  transition: "bg-purple-400",
};

interface Props {
  label: string;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
  className?: string;
}

export function RegimeBadge({
  label,
  size = "md",
  showDot = true,
  className,
}: Props) {
  const key = label.toLowerCase();
  const styles =
    REGIME_STYLES[key] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
  const dot = REGIME_DOTS[key] ?? "bg-gray-400";

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        styles,
        sizeStyles[size],
        className,
      )}
    >
      {showDot && (
        <span
          className={cn(
            "rounded-full flex-shrink-0",
            dot,
            size === "sm"
              ? "w-1.5 h-1.5"
              : size === "lg"
                ? "w-2.5 h-2.5"
                : "w-2 h-2",
          )}
        />
      )}
      {label}
    </span>
  );
}
