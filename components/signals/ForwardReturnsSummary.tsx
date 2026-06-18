"use client";

import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { ReturnPill } from "@/components/shared/ReturnPill";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FwdSummary {
  symbol: string;
  horizon_days: number;
  avg_return: number;
  median_return: number;
  win_rate: number;
  sample_count: number;
}

function ciWidth(avgReturn: number, winRate: number, n: number): number {
  const spread =
    Math.abs(avgReturn) / Math.max(Math.abs(winRate - 0.5) * 2, 0.1);
  return (1.96 * spread) / Math.sqrt(n);
}

function HorizonRow({ row }: { row: FwdSummary }) {
  const ci = ciWidth(row.avg_return, row.win_rate, row.sample_count);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="w-full flex items-center justify-between
          text-xs py-1.5 hover:bg-muted/30 rounded px-1 -mx-1"
        >
          <span className="text-muted-foreground">{row.horizon_days}d</span>
          <ReturnPill value={row.avg_return} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-56 bg-card border-border text-xs space-y-1.5 p-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Median</span>
          <span className="font-mono text-foreground">
            {(row.median_return * 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">95% CI</span>
          <span className="font-mono text-foreground">
            [{((row.avg_return - ci) * 100).toFixed(2)}%,{" "}
            {((row.avg_return + ci) * 100).toFixed(2)}%]
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Win rate</span>
          <span className="font-mono text-foreground">
            {(row.win_rate * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Observations</span>
          <span className="font-mono text-foreground">{row.sample_count}</span>
        </div>
        {row.sample_count < 10 && (
          <p className="text-orange-400 pt-1">
            ⚠ Small sample — treat with caution
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
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
            <div className="space-y-0.5">
              {rows.map((r) => (
                <HorizonRow key={r.horizon_days} row={r} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
