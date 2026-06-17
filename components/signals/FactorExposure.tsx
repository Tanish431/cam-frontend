"use client";

import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface Exposure {
  symbol: string;
  factor: string;
  beta: number;
  r_squared: number;
}
interface AssetRow {
  symbol: string;
  r_squared: number;
  market_beta: number;
  vix_corr: number;
  vol_ratio: number;
  max_drawdown: number;
}

function MetricBar({
  value,
  min,
  max,
  reverse = false,
}: {
  value: number;
  min: number;
  max: number;
  reverse?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const high = reverse ? pct < 40 : pct > 60;
  const low = reverse ? pct > 60 : pct < 40;
  const color = high
    ? "bg-green-400"
    : low
      ? "bg-red-400"
      : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-10">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function RSquaredBadge({ value }: { value: number }) {
  const pct = (value * 100).toFixed(0);
  const style =
    value > 0.7
      ? "bg-green-500/15 text-green-400"
      : value > 0.4
        ? "bg-yellow-500/15 text-yellow-400"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${style}`}>
      R²={pct}%
    </span>
  );
}

export function FactorExposure() {
  const { data, loading } = useApi<Exposure[]>(`/api/factor-exposures`, []);
  const [selected, setSelected] = useState<string | null>(null);

  if (loading) return <Skeleton className="h-64 w-full rounded-lg" />;
  if (!data?.length)
    return <p className="text-sm text-muted-foreground">No factor data.</p>;

  const map = new Map<string, AssetRow>();
  for (const row of data) {
    if (!map.has(row.symbol)) {
      map.set(row.symbol, {
        symbol: row.symbol,
        r_squared: 0,
        market_beta: 0,
        vix_corr: 0,
        vol_ratio: 0,
        max_drawdown: 0,
      });
    }
    const entry = map.get(row.symbol)!;
    entry.r_squared = row.r_squared;
    if (row.factor === "market_beta") entry.market_beta = row.beta;
    if (row.factor === "vix_corr") entry.vix_corr = row.beta;
    if (row.factor === "vol_ratio") entry.vol_ratio = row.beta;
    if (row.factor === "max_drawdown") entry.max_drawdown = row.beta;
  }
  const rows = Array.from(map.values());

  return (
    <div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium">
                Asset
              </th>
              <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium">
                R²
              </th>
              <th className="text-left py-2 pr-6 text-xs text-muted-foreground font-medium">
                Market β
              </th>
              <th className="text-left py-2 pr-6 text-xs text-muted-foreground font-medium">
                VIX Corr
              </th>
              <th className="text-left py-2 pr-6 text-xs text-muted-foreground font-medium">
                Vol Ratio
              </th>
              <th className="text-left py-2 text-xs text-muted-foreground font-medium">
                Max DD
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((a) => (
              <tr
                key={a.symbol}
                onClick={() =>
                  setSelected(selected === a.symbol ? null : a.symbol)
                }
                className={`cursor-pointer transition-colors ${selected === a.symbol ? "bg-primary/5" : "hover:bg-muted/30"}`}
              >
                <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                  {a.symbol}
                </td>
                <td className="py-2.5 pr-4">
                  <RSquaredBadge value={a.r_squared} />
                </td>
                <td className="py-2.5 pr-6">
                  <MetricBar value={a.market_beta} min={-2} max={2} />
                </td>
                <td className="py-2.5 pr-6">
                  <MetricBar value={a.vix_corr} min={-1} max={1} reverse />
                </td>
                <td className="py-2.5 pr-6">
                  <MetricBar value={a.vol_ratio} min={0} max={3} reverse />
                </td>
                <td className="py-2.5">
                  <MetricBar value={a.max_drawdown} min={0} max={0.5} reverse />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
