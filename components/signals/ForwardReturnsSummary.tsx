"use client";

import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { ReturnPill } from "@/components/shared/ReturnPill";

interface FwdSummary {
  symbol: string;
  horizon_days: number;
  avg_return: number;
  median_return: number;
  win_rate: number;
  sample_count: number;
}

export function ForwardReturnsSummary({ window }: { window: number }) {
  const { data, loading } = useApi<{ summary: FwdSummary[] }>(
    `/api/forward-returns?window=${window}`,
    [window],
  );

  if (loading) return <Skeleton className="h-48 w-full rounded-lg" />;
  if (!data?.summary?.length)
    return (
      <p className="text-sm text-muted-foreground">No forward return data.</p>
    );

  const symbols = [...new Set(data.summary.map((d) => d.symbol))];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {symbols.map((sym) => {
        const rows = data.summary
          .filter((d) => d.symbol === sym)
          .sort((a, b) => a.horizon_days - b.horizon_days);
        return (
          <div
            key={sym}
            className="bg-muted/20 rounded-lg p-3 border border-border/50"
          >
            <p className="font-mono font-bold text-foreground text-sm mb-2">
              {sym}
            </p>
            <div className="space-y-1.5">
              {rows.map((r) => (
                <div
                  key={r.horizon_days}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">
                    {r.horizon_days}d
                  </span>
                  <ReturnPill value={r.avg_return} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
