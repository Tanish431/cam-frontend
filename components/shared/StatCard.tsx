import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  sub,
  trend,
  trendValue,
  className,
  valueClassName,
}: Props) {
  const trendColor =
    trend === "up"
      ? "text-green-400"
      : trend === "down"
        ? "text-red-400"
        : "text-muted-foreground";

  return (
    <Card
      className={cn("bg-card border-border px-4 py-3 space-y-1", className)}
    >
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {label}
      </p>
      <p
        className={cn(
          "text-2xl font-bold font-mono text-foreground",
          valueClassName,
        )}
      >
        {value}
      </p>
      {(sub || trendValue) && (
        <p
          className={cn(
            "text-xs",
            trendValue ? trendColor : "text-muted-foreground",
          )}
        >
          {trendValue ?? sub}
        </p>
      )}
    </Card>
  );
}
