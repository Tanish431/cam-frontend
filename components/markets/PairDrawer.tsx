"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { ReturnPill } from "@/components/shared/ReturnPill";
import { Separator } from "@/components/ui/separator";

interface Props {
  pair: [string, string] | null;
  window: number;
  onClose: () => void;
}

interface PairHistory {
  time: string;
  correlation: number;
  zscore: number;
}
interface LeadLagPoint {
  lag_days: number;
  correlation: number;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground font-mono">{label}</p>
      <p className="font-mono font-semibold text-foreground">
        {payload[0].value.toFixed(3)}
      </p>
    </div>
  );
}

function CorrelationChart({
  symbolA,
  symbolB,
  window,
}: {
  symbolA: string;
  symbolB: string;
  window: number;
}) {
  const a = encodeURIComponent(symbolA);
  const b = encodeURIComponent(symbolB);
  const { data, loading } = useApi<PairHistory[]>(
    `/api/correlations/${a}/${b}?window=${window}`,
    [symbolA, symbolB, window],
  );

  if (loading) return <Skeleton className="h-44 w-full rounded-lg" />;
  if (!data?.length)
    return <p className="text-sm text-muted-foreground">No data.</p>;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart
        data={data}
        margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
      >
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: "rgb(92 90 87)" }}
          tickFormatter={(v) => v.slice(5)}
          interval={Math.floor(data.length / 6)}
          axisLine={{ stroke: "rgb(46 44 42)" }}
          tickLine={false}
        />
        <YAxis
          domain={[-1, 1]}
          tick={{ fontSize: 10, fill: "rgb(92 90 87)" }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <ReferenceLine y={0} stroke="rgb(92 90 87)" strokeDasharray="3 3" />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="correlation"
          stroke="#4f8ef7"
          dot={false}
          strokeWidth={1.5}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function LeadLagChart({
  symbolA,
  symbolB,
}: {
  symbolA: string;
  symbolB: string;
}) {
  const a = encodeURIComponent(symbolA);
  const b = encodeURIComponent(symbolB);
  const { data, loading } = useApi<LeadLagPoint[]>(`/api/lead-lag/${a}/${b}`, [
    symbolA,
    symbolB,
  ]);

  if (loading) return <Skeleton className="h-36 w-full rounded-lg" />;
  if (!data?.length)
    return <p className="text-sm text-muted-foreground">No lead-lag data.</p>;

  const peak = data
    .filter((p) => p.lag_days !== 0)
    .reduce(
      (best, cur) =>
        Math.abs(cur.correlation) > Math.abs(best.correlation) ? cur : best,
      data[0],
    );

  const peakLabel =
    peak.lag_days === 0
      ? "Concurrent"
      : peak.lag_days < 0
        ? `${symbolA} leads by ${Math.abs(peak.lag_days)}d`
        : `${symbolB} leads by ${peak.lag_days}d`;

  // auto-scale domain to actual data range with padding
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.correlation)), 0.05);
  const domain = [-maxAbs * 1.3, maxAbs * 1.3];

  return (
    <div className="space-y-2">
      <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
        <p className="text-xs text-primary">
          <span className="font-semibold">{peakLabel}</span> · r=
          {peak.correlation.toFixed(3)}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
        >
          <XAxis
            dataKey="lag_days"
            tick={{ fontSize: 9, fill: "rgb(92 90 87)" }}
            tickFormatter={(v) => (v === 0 ? "0" : `${v > 0 ? "+" : ""}${v}`)}
            axisLine={{ stroke: "rgb(46 44 42)" }}
            tickLine={false}
          />
          <YAxis
            domain={domain}
            tick={{ fontSize: 9, fill: "rgb(92 90 87)" }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <ReferenceLine y={0} stroke="rgb(92 90 87)" />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="correlation" radius={[2, 2, 0, 0]} minPointSize={2}>
            {data.map((entry, i) => (
              <Cell
                key={`${entry.lag_days}-${i}`}
                fill={
                  entry.lag_days === 0
                    ? "#6b7280"
                    : entry.correlation > 0
                      ? "#4ade80"
                      : "#f87171"
                }
                opacity={peak.lag_days === entry.lag_days ? 1 : 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface FwdSummary {
  symbol: string;
  horizon_days: number;
  avg_return: number;
  median_return: number;
  win_rate: number;
  sample_count: number;
}

function ForwardReturnsSection({
  window,
  symbolA,
  symbolB,
}: {
  window: number;
  symbolA: string;
  symbolB: string;
}) {
  const [open, setOpen] = useState(false);
  const { data, loading } = useApi<{ summary: FwdSummary[] }>(
    `/api/forward-returns?window=${window}`,
    [window],
  );

  if (loading) return <Skeleton className="h-20 w-full rounded-lg" />;
  if (!data?.summary?.length) return null;

  const filtered = data.summary.filter(
    (r) => r.symbol === symbolA || r.symbol === symbolB,
  );

  if (!filtered.length) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex items-center justify-between w-full
        text-sm font-medium text-foreground py-2 group"
      >
        Forward Returns ({symbolA}, {symbolB})
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform
          ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 pt-2">
        {filtered.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-2 py-1.5
            rounded hover:bg-muted/40 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-foreground w-16">
                {r.symbol}
              </span>
              <span className="text-muted-foreground">{r.horizon_days}d</span>
            </div>
            <div className="flex items-center gap-3">
              <ReturnPill value={r.avg_return} />
              <span className="text-muted-foreground font-mono w-8 text-right">
                {(r.win_rate * 100).toFixed(0)}%
              </span>
              <span className="text-muted-foreground font-mono">
                n={r.sample_count}
              </span>
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PairDrawer({ pair, window, onClose }: Props) {
  return (
    <Sheet open={!!pair} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto">
        {pair && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-mono text-foreground">
                {pair[0]} / {pair[1]}
              </SheetTitle>
              <SheetDescription>
                {window}d rolling window analysis
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  Rolling Correlation
                </p>
                <CorrelationChart
                  symbolA={pair[0]}
                  symbolB={pair[1]}
                  window={window}
                />
              </div>

              <Separator className="bg-border" />

              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  Lead-Lag Relationship
                </p>
                <LeadLagChart symbolA={pair[0]} symbolB={pair[1]} />
              </div>

              <Separator className="bg-border" />

              <ForwardReturnsSection
                window={window}
                symbolA={pair[0]}
                symbolB={pair[1]}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
