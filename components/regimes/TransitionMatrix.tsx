"use client";

import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface Profile {
  cluster_id: number;
  label: string;
}
interface TransitionData {
  probabilities: number[][];
  counts: number[][];
  profiles: Profile[];
  current_cluster: number;
  most_likely_next: number;
  transition_count: number;
}

const CLUSTER_HEX = ["#4ade80", "#60a5fa", "#fbbf24", "#fb923c"];

function probStyle(p: number) {
  if (p === 0) return { background: "transparent", color: "#5c5a57" };
  const alpha = Math.min(0.15 + p * 0.85, 1);
  return {
    background: `rgba(79, 142, 247, ${alpha})`,
    color: alpha > 0.5 ? "#0f0e0d" : "#f5f3f0",
  };
}

export function TransitionMatrix({ window }: { window: number }) {
  const { data, loading } = useApi<TransitionData>(
    `/api/transition-matrix?window=${window}`,
    [window],
  );
  const [showCounts, setShowCounts] = useState(false);

  if (loading) return <Skeleton className="h-64 w-full rounded-lg" />;
  if (!data?.probabilities?.length)
    return (
      <p className="text-sm text-muted-foreground">
        Not enough regime transitions yet.
      </p>
    );

  const {
    probabilities,
    counts,
    profiles,
    current_cluster,
    most_likely_next,
    transition_count,
  } = data;
  const k = probabilities.length;
  const currentLabel =
    profiles.find((p) => p.cluster_id === current_cluster)?.label ?? "—";
  const nextLabel =
    profiles.find((p) => p.cluster_id === most_likely_next)?.label ?? "—";
  const nextProb =
    most_likely_next >= 0
      ? (probabilities[current_cluster]?.[most_likely_next] ?? 0)
      : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-lg px-4 py-3"
          style={{
            background: `${CLUSTER_HEX[current_cluster % 4]}15`,
            border: `1px solid ${CLUSTER_HEX[current_cluster % 4]}30`,
          }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
            Current
          </p>
          <p
            className="font-bold text-foreground"
            style={{ color: CLUSTER_HEX[current_cluster % 4] }}
          >
            {currentLabel}
          </p>
        </div>
        {most_likely_next >= 0 && nextProb > 0 && (
          <div
            className="rounded-lg px-4 py-3"
            style={{
              background: `${CLUSTER_HEX[most_likely_next % 4]}15`,
              border: `1px solid ${CLUSTER_HEX[most_likely_next % 4]}30`,
            }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
              Most likely next
            </p>
            <p
              className="font-bold"
              style={{ color: CLUSTER_HEX[most_likely_next % 4] }}
            >
              {nextLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              {(nextProb * 100).toFixed(0)}% probability
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Based on {transition_count} regime transitions (weekly sampling)
        </p>
        <button
          onClick={() => setShowCounts(!showCounts)}
          className="text-xs px-2 py-1 bg-muted/50 hover:bg-muted text-muted-foreground rounded transition-colors"
        >
          {showCounts ? "Show %" : "Show counts"}
        </button>
      </div>

      {transition_count < 5 && (
        <div
          className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20
          px-3 py-2 rounded-lg"
        >
          Only {transition_count} transitions observed — high uncertainty.
        </div>
      )}

      <div className="overflow-auto">
        <table className="border-collapse text-sm w-full">
          <thead>
            <tr>
              <th className="text-left py-2 pr-3 text-xs text-muted-foreground font-medium">
                From → To
              </th>
              {profiles.map((p) => (
                <th
                  key={p.cluster_id}
                  className="text-center py-2 px-1 text-xs font-medium"
                >
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      background: `${CLUSTER_HEX[p.cluster_id % 4]}15`,
                      color: CLUSTER_HEX[p.cluster_id % 4],
                    }}
                  >
                    {p.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map((fromP, i) => {
              const rowTotal = Array.from(
                { length: k },
                (_, j) => counts[i]?.[j] ?? 0,
              ).reduce((s, v) => s + v, 0);
              return (
                <tr key={fromP.cluster_id}>
                  <td className="py-1.5 pr-3">
                    <span
                      className="text-xs font-medium"
                      style={{ color: CLUSTER_HEX[fromP.cluster_id % 4] }}
                    >
                      {fromP.label}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      n={rowTotal}
                    </span>
                  </td>
                  {Array.from({ length: k }, (_, j) => {
                    const prob = probabilities[i]?.[j] ?? 0;
                    const count = counts[i]?.[j] ?? 0;
                    const isLikely =
                      i === current_cluster && j === most_likely_next;
                    const style = probStyle(prob);
                    return (
                      <td key={j} className="py-1 px-1">
                        <div
                          className="rounded text-center py-2 text-xs font-mono font-semibold"
                          style={{
                            ...style,
                            outline: isLikely ? "2px solid #fbbf24" : "none",
                          }}
                        >
                          {prob === 0
                            ? "—"
                            : showCounts
                              ? count
                              : `${(prob * 100).toFixed(0)}%`}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
