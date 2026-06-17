"use client";

import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface CorrelationEntry {
  symbol_a: string;
  symbol_b: string;
  correlation: number;
  zscore: number;
}

function StatRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/60 last:border-0">
      <div className="text-muted-foreground/50 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

export function QuickStats({ window }: { window: number }) {
  const { data, loading } = useApi<CorrelationEntry[]>(
    `/api/correlations?window=${window}`,
    [window],
  );

  if (loading)
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );

  if (!data?.length)
    return <p className="text-sm text-muted-foreground">No data available.</p>;

  const anomalies = data.filter((d) => Math.abs(d.zscore) > 2);
  const mostAnomaly = [...data].sort(
    (a, b) => Math.abs(b.zscore) - Math.abs(a.zscore),
  )[0];
  const strongest = [...data].sort(
    (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation),
  )[0];
  const avgCorr =
    data.reduce((s, d) => s + Math.abs(d.correlation), 0) / data.length;
  const mostNegative = [...data].sort(
    (a, b) => a.correlation - b.correlation,
  )[0];

  return (
    <div>
      <StatRow
        icon={<AlertTriangle className="w-4 h-4" />}
        label="Active anomalies"
      >
        <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
          {anomalies.length}
        </p>
        <p className="text-xs text-muted-foreground">pairs at |z| &gt; 2σ</p>
      </StatRow>

      <StatRow icon={<Activity className="w-4 h-4" />} label="Most anomalous">
        <p className="font-mono font-semibold text-foreground text-sm mt-0.5">
          {mostAnomaly.symbol_a}/{mostAnomaly.symbol_b}
        </p>
        <p className="text-xs text-red-400 font-mono">
          z={mostAnomaly.zscore.toFixed(2)} · r=
          {mostAnomaly.correlation.toFixed(2)}
        </p>
      </StatRow>

      <StatRow
        icon={<TrendingUp className="w-4 h-4" />}
        label="Strongest relationship"
      >
        <p className="font-mono font-semibold text-foreground text-sm mt-0.5">
          {strongest.symbol_a}/{strongest.symbol_b}
        </p>
        <p
          className={`text-xs font-mono ${
            strongest.correlation > 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          r={strongest.correlation.toFixed(3)}
        </p>
      </StatRow>

      <StatRow
        icon={<TrendingDown className="w-4 h-4" />}
        label="Most negative pair"
      >
        <p className="font-mono font-semibold text-foreground text-sm mt-0.5">
          {mostNegative.symbol_a}/{mostNegative.symbol_b}
        </p>
        <p className="text-xs text-red-400 font-mono">
          r={mostNegative.correlation.toFixed(3)}
        </p>
      </StatRow>

      <div className="pt-3 mt-1">
        <p className="text-xs text-muted-foreground">
          Average |correlation| across all 28 pairs:{" "}
          <span className="font-mono text-foreground font-semibold">
            {avgCorr.toFixed(3)}
          </span>
        </p>
      </div>
    </div>
  );
}
