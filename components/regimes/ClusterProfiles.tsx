"use client";

import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";

interface ClusterProfile {
  cluster_id: number;
  label: string;
  description: string;
  avg_zscore: number;
  sample_count: number;
}

interface ClusterData {
  current: { cluster_id: number };
  profiles: ClusterProfile[];
}

const CLUSTER_HEX = ["#4ade80", "#60a5fa", "#fbbf24", "#fb923c"];

export function ClusterProfiles({ window }: { window: number }) {
  const { data, loading } = useApi<ClusterData>(
    `/api/regime-clusters?window=${window}`,
    [window],
  );

  if (loading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  if (!data?.profiles?.length)
    return <p className="text-sm text-muted-foreground">No data.</p>;

  return (
    <div className="space-y-2">
      {data.profiles.map((p) => {
        const isCurrent = p.cluster_id === data.current.cluster_id;
        const color = CLUSTER_HEX[p.cluster_id % 4];
        return (
          <div
            key={p.cluster_id}
            className="rounded-lg px-4 py-3 border transition-colors"
            style={{
              background: isCurrent ? `${color}10` : "transparent",
              borderColor: isCurrent ? `${color}30` : "transparent",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: color }}
                />
                <span className="font-semibold text-sm text-foreground">
                  {p.label}
                </span>
                {isCurrent && (
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: `${color}20`, color }}
                  >
                    current
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                <span>avg|z|={p.avg_zscore.toFixed(2)}</span>
                <span>{p.sample_count}d</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 pl-4">
              {p.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
