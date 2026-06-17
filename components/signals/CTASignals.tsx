"use client";

import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";

interface Signal {
  symbol: string;
  signal_type: string;
  value: number;
  normalized: number;
}
interface AssetSignals {
  symbol: string;
  trend: Signal | null;
  momentum: Signal | null;
  vol_regime: Signal | null;
}

function TrendIndicator({ value }: { value: number }) {
  if (value > 0)
    return (
      <span className="text-green-400 font-semibold text-xs">
        ↑ Above MA200
      </span>
    );
  if (value < 0)
    return (
      <span className="text-red-400 font-semibold text-xs">↓ Below MA200</span>
    );
  return <span className="text-muted-foreground text-xs">—</span>;
}

function MomentumBar({ normalized }: { normalized: number }) {
  const clamped = Math.max(-2, Math.min(2, normalized));
  const pct = ((clamped + 2) / 4) * 100;
  const color =
    normalized > 0.5
      ? "bg-green-400"
      : normalized < -0.5
        ? "bg-red-400"
        : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground">
        {normalized.toFixed(2)}σ
      </span>
    </div>
  );
}

function VolBadge({ value }: { value: number }) {
  if (value > 1.5)
    return (
      <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-medium">
        High {value.toFixed(2)}x
      </span>
    );
  if (value > 1.0)
    return (
      <span className="text-[10px] bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full font-medium">
        Elevated {value.toFixed(2)}x
      </span>
    );
  return (
    <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-medium">
      Low {value.toFixed(2)}x
    </span>
  );
}

export function CTASignals() {
  const { data, loading } = useApi<Signal[]>(`/api/signals`, []);

  if (loading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );
  if (!data?.length)
    return <p className="text-sm text-muted-foreground">No signal data.</p>;

  const map = new Map<string, AssetSignals>();
  for (const s of data) {
    if (!map.has(s.symbol))
      map.set(s.symbol, {
        symbol: s.symbol,
        trend: null,
        momentum: null,
        vol_regime: null,
      });
    const entry = map.get(s.symbol)!;
    if (s.signal_type === "trend") entry.trend = s;
    if (s.signal_type === "momentum") entry.momentum = s;
    if (s.signal_type === "vol_regime") entry.vol_regime = s;
  }
  const rows = Array.from(map.values());

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Asset
            </th>
            <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Trend
            </th>
            <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Momentum
            </th>
            <th className="text-left py-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Volatility
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {rows.map((a) => (
            <tr key={a.symbol} className="hover:bg-muted/30">
              <td className="py-2.5 pr-4 font-mono font-bold text-foreground">
                {a.symbol}
              </td>
              <td className="py-2.5 pr-4">
                {a.trend ? <TrendIndicator value={a.trend.value} /> : "—"}
              </td>
              <td className="py-2.5 pr-4">
                {a.momentum ? (
                  <MomentumBar normalized={a.momentum.normalized} />
                ) : (
                  "—"
                )}
              </td>
              <td className="py-2.5">
                {a.vol_regime ? <VolBadge value={a.vol_regime.value} /> : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
