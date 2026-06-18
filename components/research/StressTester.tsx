"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

interface AssetVol {
  symbol: string;
  vol: number;
}
interface RegimeVol {
  cluster_id: number;
  label: string;
  vol: number;
}
interface AnalogueRet {
  date: string;
  return: number;
}
interface StressResult {
  portfolio_vol: number;
  undiversified_vol: number;
  diversification_ratio: number;
  asset_vols: AssetVol[];
  regime_vols: RegimeVol[];
  analogue_returns: AnalogueRet[];
}

const AVAILABLE_ASSETS = [
  "SPY",
  "QQQ",
  "GLD",
  "TLT",
  "DX-Y.NYB",
  "BTC-USD",
  "USO",
  "^VIX",
];
const REGIME_HEX = ["#4ade80", "#60a5fa", "#fbbf24", "#fb923c"];

function pct(v: number) {
  if (!v || isNaN(v)) return "—";
  return (v * 100).toFixed(1) + "%";
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-mono font-semibold text-foreground">
        {pct(payload[0].value)}
      </p>
    </div>
  );
}

export function StressTester({ window }: { window: number }) {
  const [weights, setWeights] = useState<Record<string, string>>({
    SPY: "0.4",
    TLT: "0.3",
    GLD: "0.2",
    "BTC-USD": "0.1",
  });
  const [result, setResult] = useState<StressResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalWeight = Object.values(weights).reduce(
    (s, v) => s + (parseFloat(v) || 0),
    0,
  );
  const weightTotal = Math.round(totalWeight * 100);

  function addAsset(symbol: string) {
    if (weights[symbol] !== undefined) return;
    setWeights((prev) => ({ ...prev, [symbol]: "0" }));
  }
  function removeAsset(symbol: string) {
    setWeights((prev) => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
  }

  async function runStress() {
    setError("");
    const parsed: Record<string, number> = {};
    for (const [k, v] of Object.entries(weights)) {
      const n = parseFloat(v);
      if (isNaN(n) || n < 0) {
        setError(`Invalid weight for ${k}`);
        return;
      }
      if (n > 0) parsed[k] = n;
    }
    const total = Object.values(parsed).reduce((s, v) => s + v, 0);
    if (Math.abs(total - 1) > 0.01) {
      setError(`Weights sum to ${(total * 100).toFixed(1)}% — must equal 100%`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/portfolio-stress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights: parsed, window_days: window }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "request failed");
        return;
      }
      setResult(data);
    } catch {
      setError("could not connect to server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">
            Portfolio Weights
          </p>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded-full ${
              weightTotal === 100
                ? "bg-green-500/15 text-green-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            {weightTotal}% / 100%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {Object.entries(weights).map(([symbol, val]) => (
            <div
              key={symbol}
              className="flex items-center gap-1 bg-muted/30 border
              border-border rounded-lg px-2 py-1.5"
            >
              <button
                onClick={() => removeAsset(symbol)}
                className="text-muted-foreground/50 hover:text-red-400 text-xs font-bold"
              >
                ×
              </button>
              <span className="font-mono text-xs font-semibold text-foreground flex-1">
                {symbol}
              </span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={val}
                onChange={(e) =>
                  setWeights((prev) => ({ ...prev, [symbol]: e.target.value }))
                }
                className="w-14 text-xs font-mono text-right bg-background border
                  border-border rounded px-1 py-0.5 focus:outline-none focus:border-primary text-foreground"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-1 flex-wrap mb-3">
          {AVAILABLE_ASSETS.filter((a) => !weights[a]).map((a) => (
            <button
              key={a}
              onClick={() => addAsset(a)}
              className="text-xs px-2 py-1 bg-muted/40 hover:bg-muted text-muted-foreground rounded font-mono"
            >
              + {a}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

        <button
          onClick={runStress}
          disabled={loading || weightTotal !== 100}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium
            rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Running..." : "Run Stress Test"}
        </button>
      </div>

      {result && (
        <div className="space-y-5 border-t border-border pt-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
              <p className="text-xs text-primary font-medium uppercase tracking-wide">
                Portfolio Vol
              </p>
              <p className="text-2xl font-bold font-mono text-foreground mt-1">
                {pct(result.portfolio_vol)}
              </p>
              <p className="text-xs text-muted-foreground">annualized</p>
            </div>
            <div className="bg-muted/30 border border-border rounded-lg px-4 py-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Undiversified
              </p>
              <p className="text-2xl font-bold font-mono text-foreground mt-1">
                {pct(result.undiversified_vol)}
              </p>
              <p className="text-xs text-muted-foreground">if uncorrelated</p>
            </div>
            <div
              className={`rounded-lg px-4 py-3 border ${
                result.diversification_ratio > 1.3
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-orange-500/10 border-orange-500/20"
              }`}
            >
              <p
                className={`text-xs font-medium uppercase tracking-wide ${
                  result.diversification_ratio > 1.3
                    ? "text-green-400"
                    : "text-orange-400"
                }`}
              >
                Diversification
              </p>
              <p
                className={`text-2xl font-bold font-mono mt-1 ${
                  result.diversification_ratio > 1.3
                    ? "text-green-400"
                    : "text-orange-400"
                }`}
              >
                {result.diversification_ratio.toFixed(2)}x
              </p>
              <p className="text-xs text-muted-foreground">
                {result.diversification_ratio > 1.3
                  ? "healthy"
                  : "low — correlations elevated"}
              </p>
            </div>
          </div>

          {result.regime_vols?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Portfolio Vol by Regime
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={result.regime_vols}
                  margin={{ top: 16, right: 8, bottom: 0, left: -10 }}
                >
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "rgb(92 90 87)" }}
                    axisLine={{ stroke: "rgb(46 44 42)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => pct(v)}
                    tick={{ fontSize: 10, fill: "rgb(92 90 87)" }}
                    domain={[0, (max: number) => max * 1.3]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReferenceLine
                    y={result.portfolio_vol}
                    stroke="#4f8ef7"
                    strokeDasharray="4 2"
                    label={{
                      value: "current",
                      fontSize: 10,
                      fill: "#4f8ef7",
                      position: "insideTopRight",
                    }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="vol" radius={[6, 6, 0, 0]} maxBarSize={64}>
                    {result.regime_vols.map((r) => (
                      <Cell
                        key={r.cluster_id}
                        fill={REGIME_HEX[r.cluster_id % 4]}
                        fillOpacity={0.75}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Individual Asset Volatilities
            </p>
            <div className="space-y-1">
              {result.asset_vols.map((a) => (
                <div key={a.symbol} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-foreground w-20">
                    {a.symbol}
                  </span>
                  <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(a.vol * 200, 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground w-14 text-right">
                    {pct(a.vol)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {result.analogue_returns?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Portfolio Return on Analogue Dates
              </p>
              <div className="space-y-1">
                {result.analogue_returns.map((a, i) => (
                  <div
                    key={`${a.date}-${i}`}
                    className="flex items-center justify-between
                    text-xs px-3 py-1.5 rounded hover:bg-muted/30"
                  >
                    <span className="font-mono text-muted-foreground">
                      {a.date}
                    </span>
                    <span
                      className={`font-mono font-semibold ${
                        a.return > 0
                          ? "text-green-400"
                          : a.return < 0
                            ? "text-red-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {a.return > 0 ? "+" : ""}
                      {(a.return * 100).toFixed(3)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
