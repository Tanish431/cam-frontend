"use client";

import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";

interface ChangePoint {
  change_date: string;
  symbol_a: string;
  symbol_b: string;
  zscore_before: number;
  zscore_after: number;
  magnitude: number;
}

function MagnitudeBadge({ value }: { value: number }) {
  if (value > 2.5)
    return (
      <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-semibold">
        Major
      </span>
    );
  if (value > 1.5)
    return (
      <span className="text-[10px] bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full font-semibold">
        Moderate
      </span>
    );
  return (
    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
      Minor
    </span>
  );
}

export function StructuralBreaks({ window }: { window: number }) {
  const { data, loading } = useApi<ChangePoint[]>(
    `/api/change-points?window=${window}`,
    [window],
  );

  if (loading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  if (!data?.length)
    return (
      <p className="text-sm text-muted-foreground">
        No structural breaks detected.
      </p>
    );

  const byDate = data.reduce(
    (acc, cp) => {
      if (!acc[cp.change_date]) acc[cp.change_date] = [];
      acc[cp.change_date].push(cp);
      return acc;
    },
    {} as Record<string, ChangePoint[]>,
  );

  const sortedDates = Object.keys(byDate)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 8);

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto">
      {sortedDates.map((date) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-mono font-semibold text-foreground">
              {date}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="ml-3 space-y-1">
            {byDate[date]
              .sort((a, b) => b.magnitude - a.magnitude)
              .map((cp, i) => (
                <div
                  key={`${cp.symbol_a}-${cp.symbol_b}-${i}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg
                  bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-foreground text-sm">
                      {cp.symbol_a}/{cp.symbol_b}
                    </span>
                    <MagnitudeBadge value={cp.magnitude} />
                  </div>
                  <span className="text-xs font-mono">
                    <span className="text-muted-foreground">
                      {cp.zscore_before.toFixed(2)}
                    </span>
                    <span
                      className={
                        cp.zscore_after > cp.zscore_before
                          ? "text-red-400"
                          : "text-green-400"
                      }
                    >
                      {" "}
                      →{" "}
                    </span>
                    <span className="text-foreground">
                      {cp.zscore_after.toFixed(2)}
                    </span>
                  </span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
