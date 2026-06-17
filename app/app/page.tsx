"use client";

import { TopBar } from "@/components/layout/TopBar";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatTile } from "@/components/shared/StatTile";
import { RegimeBadge } from "@/components/shared/RegimeBadge";
import { useWindow } from "@/providers/WindowProvider";
import { useApi } from "@/lib/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, AlertTriangle, Layers, TrendingUp } from "lucide-react";
import Link from "next/link";

interface SystemicRiskData {
  current: number;
  zscore: number;
  mean: number;
  history: { time: string; score: number }[];
}

interface ClusterData {
  current: { cluster_id: number; label: string; desc: string };
  timeline: { time: string; cluster_id: number; label: string }[];
}

interface RegimeEvent {
  time: string;
  symbol_a: string;
  symbol_b: string;
  window_days: number;
  correlation: number;
  zscore: number;
}

const CLUSTER_HEX = ["#4ade80", "#60a5fa", "#fbbf24", "#fb923c"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground font-mono">{label}</p>
      <p className="text-sm font-mono font-semibold text-foreground">
        {payload[0].value.toFixed(3)}
      </p>
    </div>
  );
}

function SystemicRiskChart({ window }: { window: number }) {
  const { data, loading } = useApi<SystemicRiskData>(
    `/api/systemic-risk?window=${window}`,
    [window],
  );

  if (loading) return <Skeleton className="h-48 w-full rounded-lg" />;
  if (!data?.history?.length)
    return <p className="text-sm text-muted-foreground">No data available.</p>;

  const history = data.history.slice(-120);

  return (
    <ResponsiveContainer width="100%" height={190}>
      <LineChart
        data={history}
        margin={{ top: 4, right: 8, bottom: 0, left: -24 }}
      >
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: "rgb(92 90 87)" }}
          tickFormatter={(v) => v.slice(5)}
          interval={Math.floor(history.length / 5)}
          axisLine={{ stroke: "rgb(46 44 42)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "rgb(92 90 87)" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <ReferenceLine
          y={data.mean}
          stroke="rgb(92 90 87)"
          strokeDasharray="3 3"
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#4f8ef7"
          dot={false}
          strokeWidth={1.75}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function RegimeTimelineMini({ window }: { window: number }) {
  const { data, loading } = useApi<ClusterData>(
    `/api/regime-clusters?window=${window}`,
    [window],
  );

  if (loading) return <Skeleton className="h-48 w-full rounded-lg" />;
  if (!data?.timeline?.length)
    return <p className="text-sm text-muted-foreground">No data available.</p>;

  const recent = [...data.timeline].reverse().slice(0, 90);

  return (
    <div className="space-y-3">
      <div className="flex gap-px h-24 items-stretch">
        {recent.map((entry, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-opacity"
            style={{
              background: CLUSTER_HEX[entry.cluster_id % 4],
              opacity: 0.5 + (i / recent.length) * 0.5,
            }}
            title={`${entry.time}: ${entry.label}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
        <span>{recent[recent.length - 1]?.time}</span>
        <span>{recent[0]?.time} →</span>
      </div>
    </div>
  );
}

function TopAnomaliesTable() {
  const { data, loading } = useApi<RegimeEvent[]>(`/api/regime-events`, []);

  if (loading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );

  if (!data?.length)
    return (
      <p className="text-sm text-muted-foreground">No anomalies detected.</p>
    );

  const top5 = data.slice(0, 5);

  return (
    <div className="space-y-1">
      {top5.map((e, i) => {
        const severity = Math.abs(e.zscore);
        return (
          <Link
            key={i}
            href="/app/markets"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg
              hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  severity > 3 ? "bg-red-400" : "bg-orange-400"
                }`}
              />
              <span className="font-mono text-sm font-semibold text-foreground">
                {e.symbol_a}/{e.symbol_b}
              </span>
              <span className="text-xs text-muted-foreground">
                {e.window_days}d
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-muted-foreground">
                r={e.correlation.toFixed(2)}
              </span>
              <span
                className={`text-xs font-mono font-semibold ${
                  severity > 3 ? "text-red-400" : "text-orange-400"
                }`}
              >
                z={e.zscore.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {e.time}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function OverviewPage() {
  const { window } = useWindow();
  const { data: systemicData, loading: systemicLoading } =
    useApi<SystemicRiskData>(`/api/systemic-risk?window=${window}`, [window]);
  const { data: clusterData, loading: clusterLoading } = useApi<ClusterData>(
    `/api/regime-clusters?window=${window}`,
    [window],
  );
  const { data: events } = useApi<RegimeEvent[]>(`/api/regime-events`, []);

  const riskZ = systemicData?.zscore ?? 0;
  const riskTrend = riskZ > 0.3 ? "up" : riskZ < -0.3 ? "down" : "flat";
  const activeCount = events?.length ?? 0;

  return (
    <>
      <TopBar
        title="Overview"
        subtitle="MacroLens — Cross-Asset Regime Monitor"
      />

      <main className="p-6 space-y-5 max-w-7xl">
        {/* hero stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {systemicLoading ? (
            <Skeleton className="h-[92px] rounded-xl" />
          ) : (
            <StatTile
              label="Systemic Risk"
              value={`${((systemicData?.current ?? 0) * 100).toFixed(1)}%`}
              trend={riskTrend}
              trendLabel={`z=${riskZ.toFixed(2)}σ`}
              caption="avg pairwise correlation"
              accentColor={
                riskZ > 2 ? "#f97316" : riskZ > 1 ? "#fbbf24" : "#4f8ef7"
              }
              icon={<Activity className="w-5 h-5" />}
            />
          )}

          {clusterLoading ? (
            <Skeleton className="h-[92px] rounded-xl" />
          ) : (
            <StatTile
              label="Current Regime"
              value={clusterData?.current?.label ?? "—"}
              caption={`cluster ${clusterData?.current?.cluster_id ?? "—"}`}
              accentColor={
                CLUSTER_HEX[(clusterData?.current?.cluster_id ?? 0) % 4]
              }
              icon={<Layers className="w-5 h-5" />}
            />
          )}

          <StatTile
            label="Active Anomalies"
            value={String(activeCount)}
            caption={`pairs at |z| > 2σ`}
            accentColor="#ef4444"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
        </div>

        {/* charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard
            title="Systemic Risk Trend"
            subtitle={`Average |correlation| · ${window}d window · last 120 days`}
          >
            <SystemicRiskChart window={window} />
          </SectionCard>

          <SectionCard
            title="Regime Timeline"
            subtitle={`K-Means cluster history · ${window}d window`}
          >
            <RegimeTimelineMini window={window} />
          </SectionCard>
        </div>

        {/* top anomalies */}
        <SectionCard
          title="Top Anomalies"
          subtitle="Pairs with the most unusual correlation readings"
          href="/app/markets"
        >
          <TopAnomaliesTable />
        </SectionCard>
      </main>
    </>
  );
}
