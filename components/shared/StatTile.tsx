import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface Props {
  label: string;
  value: string;
  caption?: string;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  accentColor?: string; // hex for left border accent
  icon?: React.ReactNode;
}

export function StatTile({
  label,
  value,
  caption,
  trend,
  trendLabel,
  accentColor,
  icon,
}: Props) {
  const TrendIcon =
    trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-green-400"
      : trend === "down"
        ? "text-red-400"
        : "text-muted-foreground";

  return (
    <div
      className="relative bg-card border border-border rounded-xl px-5 py-4
        overflow-hidden"
      style={
        accentColor
          ? {
              borderLeftColor: accentColor,
              borderLeftWidth: "3px",
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-3xl font-bold font-mono text-foreground mt-1.5 tracking-tight">
            {value}
          </p>
        </div>
        {icon && <div className="text-muted-foreground/40 mt-0.5">{icon}</div>}
      </div>
      {(caption || trendLabel) && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend && trendLabel && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                trendColor,
              )}
            >
              <TrendIcon className="w-3 h-3" />
              {trendLabel}
            </span>
          )}
          {caption && (
            <span className="text-xs text-muted-foreground">{caption}</span>
          )}
        </div>
      )}
    </div>
  );
}
