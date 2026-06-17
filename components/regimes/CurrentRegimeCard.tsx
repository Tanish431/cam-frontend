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
  current: { cluster_id: number; label: string; desc: string };
  profiles: ClusterProfile[];
}

const CLUSTER_HEX = ["#4ade80", "#60a5fa", "#fbbf24", "#fb923c"];

export function CurrentRegimeCard({ window }: { window: number }) {
  const { data, loading } = useApi<ClusterData>(
    `/api/regime-clusters?window=${window}`,
    [window],
  );

  if (loading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (!data?.current)
    return <p className="text-sm text-muted-foreground">No data.</p>;

  const color = CLUSTER_HEX[data.current.cluster_id % 4];
  const profile = data.profiles?.find(
    (p) => p.cluster_id === data.current.cluster_id,
  );

  return (
    <div
      className="rounded-xl p-5 border relative overflow-hidden h-full flex flex-col"
      style={{
        background: `${color}10`,
        borderColor: `${color}30`,
      }}
    >
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{ background: color }}
      />
      <p
        className="text-xs uppercase tracking-widest font-medium"
        style={{ color }}
      >
        Current Regime
      </p>
      <p className="text-3xl font-bold text-foreground mt-1.5">
        {data.current.label}
      </p>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        {profile?.description ?? data.current.desc}
      </p>

      <div
        className="flex items-center gap-6 mt-4 pt-3 border-t"
        style={{ borderColor: `${color}20` }}
      >
        <div>
          <p className="text-xs text-muted-foreground">Avg |Z-score|</p>
          <p className="font-mono font-semibold text-foreground">
            {profile?.avg_zscore.toFixed(2) ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Historical days</p>
          <p className="font-mono font-semibold text-foreground">
            {profile?.sample_count ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
