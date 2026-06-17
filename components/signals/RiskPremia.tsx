"use client";

import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface PremiaEntry {
  symbol: string;
  factor: string;
  raw_score: number;
  zscore: number;
  rank: number;
}

const FACTORS = ["carry", "defensive", "low_vol"] as const;
const FACTOR_LABELS: Record<string, string> = {
  carry: "Carry",
  defensive: "Defensive",
  low_vol: "Low Vol",
};

function RankBadge({ rank, total }: { rank: number; total: number }) {
  const pct = rank / total;
  const style =
    pct <= 0.25
      ? "bg-green-500/15 text-green-400"
      : pct >= 0.75
        ? "bg-red-500/15 text-red-400"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${style}`}
    >
      {rank}
    </span>
  );
}

function ZBar({ z }: { z: number }) {
  const clamped = Math.max(-2.5, Math.min(2.5, z));
  const pct = ((clamped + 2.5) / 5) * 100;
  const color =
    z > 0.5 ? "bg-green-400" : z < -0.5 ? "bg-red-400" : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground">
        {z.toFixed(2)}
      </span>
    </div>
  );
}

export function RiskPremia() {
  const { data, loading } = useApi<PremiaEntry[]>(`/api/risk-premia`, []);
  const [activeTab, setActiveTab] = useState<"carry" | "defensive" | "low_vol">(
    "carry",
  );

  if (loading) return <Skeleton className="h-64 w-full rounded-lg" />;
  if (!data?.length)
    return (
      <p className="text-sm text-muted-foreground">No risk premia data.</p>
    );

  const total = new Set(data.map((d) => d.symbol)).size;
  const filtered = data
    .filter((d) => d.factor === activeTab)
    .sort((a, b) => a.rank - b.rank);

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {FACTORS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveTab(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            {FACTOR_LABELS[f]}
          </button>
        ))}
      </div>
      <div className="space-y-1">
        {filtered.map((entry, i) => (
          <div
            key={`${entry.symbol}-${entry.factor}-${i}`}
            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <RankBadge rank={entry.rank} total={total} />
              <span className="font-mono font-semibold text-foreground w-20 text-sm">
                {entry.symbol}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ZBar z={entry.zscore} />
              <span className="text-xs font-mono text-muted-foreground w-16 text-right">
                {entry.raw_score.toFixed(3)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
