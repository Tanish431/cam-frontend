"use client";

import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { ReturnPill } from "@/components/shared/ReturnPill";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface AssetReturns {
  [horizon: string]: number;
}

interface AnalogueOutcome {
  date: string;
  similarity: number;
  asset_returns: Record<string, AssetReturns>;
}

interface TransitionInstance {
  transition_date: string;
  from_label: string;
  to_label: string;
  asset_returns: Record<string, AssetReturns>;
}

interface TransitionSummary {
  from_label: string;
  to_label: string;
  probability: number;
  instances: TransitionInstance[];
  avg_returns: Record<string, AssetReturns>;
}

interface WhatHappensNextData {
  analogues: AnalogueOutcome[];
  transition: TransitionSummary | null;
  window: number;
  as_of: string;
}

const HORIZONS = ["5d", "10d", "20d"];

function AssetReturnGrid({
  returns,
  title,
}: {
  returns: Record<string, AssetReturns>;
  title?: string;
}) {
  const symbols = Object.keys(returns).sort();
  if (!symbols.length) return null;

  return (
    <div>
      {title && <p className="text-xs text-muted-foreground mb-2">{title}</p>}
      <table className="text-xs w-full">
        <thead>
          <tr className="border-b border-border/60">
            <th className="text-left py-1 pr-3 text-muted-foreground font-medium w-20">
              Asset
            </th>
            {HORIZONS.map((h) => (
              <th
                key={h}
                className="text-center py-1 px-2 text-muted-foreground font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {symbols.map((sym) => (
            <tr key={sym} className="hover:bg-muted/20">
              <td className="py-1.5 pr-3 font-mono font-bold text-foreground">
                {sym}
              </td>
              {HORIZONS.map((h) => (
                <td key={h} className="py-1.5 px-2 text-center">
                  <ReturnPill value={returns[sym]?.[h]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimilarityBadge({ value }: { value: number }) {
  const pct = (value * 100).toFixed(1);
  const style =
    value > 0.93
      ? "bg-red-500/15 text-red-400"
      : value > 0.88
        ? "bg-orange-500/15 text-orange-400"
        : "bg-primary/15 text-primary";
  return (
    <span
      className={`text-xs font-mono px-2 py-0.5 rounded-full font-semibold ${style}`}
    >
      {pct}% similar
    </span>
  );
}

export function AnalogueOutcomes({ window }: { window: number }) {
  const { data, loading } = useApi<WhatHappensNextData>(
    `/api/what-happens-next?window=${window}`,
    [window],
  );
  const [expandedAnalogue, setExpandedAnalogue] = useState<string | null>(null);
  const [expandedTransition, setExpandedTransition] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"analogues" | "transition">(
    "analogues",
  );

  if (loading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );

  if (!data)
    return <p className="text-sm text-muted-foreground">No data available.</p>;

  return (
    <div>
      {/* header row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-xs text-muted-foreground">
          As of <span className="font-mono text-foreground">{data.as_of}</span>
          {" · "}
          {window}d window
        </p>
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("analogues")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "analogues"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Analogue Outcomes
          </button>
          <button
            onClick={() => setActiveTab("transition")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "transition"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Transition Outcomes
          </button>
        </div>
      </div>

      {/* analogues tab */}
      {activeTab === "analogues" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">
            What happened after the {data.analogues.length} most similar
            historical dates (90-day minimum separation)
          </p>

          {data.analogues.length === 0 && (
            <p className="text-sm text-muted-foreground">No analogues found.</p>
          )}

          {data.analogues.map((a, idx) => {
            const key = `${a.date}-${idx}`;
            const isOpen = expandedAnalogue === key;
            return (
              <Collapsible
                key={key}
                open={isOpen}
                onOpenChange={(o) => setExpandedAnalogue(o ? key : null)}
              >
                <CollapsibleTrigger
                  className="w-full flex items-center justify-between
                  px-4 py-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-foreground">
                      {a.date}
                    </span>
                    <SimilarityBadge value={a.similarity} />
                  </div>
                  <div className="flex items-center gap-3">
                    {Object.entries(a.asset_returns)
                      .map(([sym, h]) => ({ sym, ret: h["20d"] ?? 0 }))
                      .sort((x, y) => y.ret - x.ret)
                      .slice(0, 2)
                      .map(({ sym, ret }) => (
                        <span key={sym} className="text-xs">
                          <span className="text-muted-foreground">{sym}</span>{" "}
                          <ReturnPill value={ret} />
                        </span>
                      ))}
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent
                  className="border border-t-0 border-border
                  rounded-b-lg px-4 py-3 bg-muted/20"
                >
                  <AssetReturnGrid
                    returns={a.asset_returns}
                    title="Forward returns after this analogue date"
                  />
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {/* aggregate across all analogues */}
          {data.analogues.length > 1 &&
            (() => {
              const agg: Record<string, AssetReturns> = {};
              for (const a of data.analogues) {
                for (const [sym, hMap] of Object.entries(a.asset_returns)) {
                  if (!agg[sym]) agg[sym] = {};
                  for (const [h, v] of Object.entries(hMap)) {
                    agg[sym][h] =
                      (agg[sym][h] ?? 0) + v / data.analogues.length;
                  }
                }
              }
              return (
                <div className="border border-primary/20 rounded-lg p-4 bg-primary/5 mt-3">
                  <p className="text-xs font-semibold text-primary mb-3">
                    Average across all {data.analogues.length} analogues
                  </p>
                  <AssetReturnGrid returns={agg} />
                </div>
              );
            })()}
        </div>
      )}

      {/* transition tab */}
      {activeTab === "transition" && (
        <div className="space-y-3">
          {!data.transition ? (
            <p className="text-sm text-muted-foreground">
              No historical transitions out of the current regime yet.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="font-bold text-foreground">
                    {data.transition.from_label}
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full h-px bg-border relative">
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      bg-card px-2 text-xs text-muted-foreground font-mono"
                    >
                      {(data.transition.probability * 100).toFixed(0)}%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.transition.instances.length} historical instance
                    {data.transition.instances.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Most likely next
                  </p>
                  <p className="font-bold text-primary">
                    {data.transition.to_label}
                  </p>
                </div>
              </div>

              {Object.keys(data.transition.avg_returns).length > 0 && (
                <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                  <p className="text-xs font-semibold text-primary mb-3">
                    Average asset returns during {data.transition.from_label} →{" "}
                    {data.transition.to_label} transitions
                  </p>
                  <AssetReturnGrid returns={data.transition.avg_returns} />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  Individual instances
                </p>
                {data.transition.instances.map((inst, i) => {
                  const key = `${inst.transition_date}-${i}`;
                  const isOpen = expandedTransition === key;
                  return (
                    <Collapsible
                      key={key}
                      open={isOpen}
                      onOpenChange={(o) =>
                        setExpandedTransition(o ? key : null)
                      }
                    >
                      <CollapsibleTrigger
                        className="w-full flex items-center justify-between
                        px-4 py-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-foreground">
                            {inst.transition_date}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {inst.from_label} → {inst.to_label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {Object.entries(inst.asset_returns)
                            .map(([sym, h]) => ({ sym, ret: h["20d"] ?? 0 }))
                            .sort((x, y) => y.ret - x.ret)
                            .slice(0, 2)
                            .map(({ sym, ret }) => (
                              <span key={sym} className="text-xs">
                                <span className="text-muted-foreground">
                                  {sym}
                                </span>{" "}
                                <ReturnPill value={ret} />
                              </span>
                            ))}
                          <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent
                        className="border border-t-0 border-border
                        rounded-b-lg px-4 py-3 bg-muted/20"
                      >
                        <AssetReturnGrid
                          returns={inst.asset_returns}
                          title={`Returns after transition on ${inst.transition_date}`}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
