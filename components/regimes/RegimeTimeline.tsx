"use client";

import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface TimelineEntry {
  time: string;
  cluster_id: number;
  label: string;
}
interface ClusterData {
  timeline: TimelineEntry[];
}

const CLUSTER_HEX = ["#4ade80", "#60a5fa", "#fbbf24", "#fb923c"];

export function RegimeTimeline({ window }: { window: number }) {
  const { data, loading } = useApi<ClusterData>(
    `/api/regime-clusters?window=${window}`,
    [window],
  );
  const [hovered, setHovered] = useState<TimelineEntry | null>(null);

  if (loading) return <Skeleton className="h-24 w-full rounded-lg" />;
  if (!data?.timeline?.length)
    return <p className="text-sm text-muted-foreground">No data.</p>;

  const recent = [...data.timeline].reverse(); // oldest → newest

  return (
    <div className="space-y-3">
      <div className="flex gap-px h-16 items-stretch">
        {recent.map((entry, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all cursor-pointer hover:scale-y-105"
            style={{
              background: CLUSTER_HEX[entry.cluster_id % 4],
              opacity: hovered
                ? hovered.time === entry.time
                  ? 1
                  : 0.3
                : 0.6 + (i / recent.length) * 0.4,
            }}
            onMouseEnter={() => setHovered(entry)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          {recent[0]?.time}
        </span>
        {hovered ? (
          <span
            className="text-xs font-mono font-semibold"
            style={{ color: CLUSTER_HEX[hovered.cluster_id % 4] }}
          >
            {hovered.time} · {hovered.label}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            hover to inspect
          </span>
        )}
        <span className="text-xs text-muted-foreground font-mono">
          {recent[recent.length - 1]?.time}
        </span>
      </div>

      <div className="flex items-center gap-4 flex-wrap pt-1">
        {["Risk-On", "Mild Stress", "Divergence", "Regime Break"].map(
          (label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: CLUSTER_HEX[i] }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
