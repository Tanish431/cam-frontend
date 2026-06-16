"use client"

import { useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from "recharts"

interface AssetVol    { symbol: string; vol: number }
interface RegimeVol   { cluster_id: number; label: string; vol: number }
interface AnalogueRet { date: string; return: number }

interface StressResult {
  portfolio_vol:         number
  undiversified_vol:     number
  diversification_ratio: number
  asset_vols:            AssetVol[]
  regime_vols:           RegimeVol[]
  analogue_returns:      AnalogueRet[]
}

const AVAILABLE_ASSETS = [
  "SPY", "QQQ", "GLD", "TLT", "DX-Y.NYB", "BTC-USD", "USO", "^VIX"
]

const REGIME_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#ef4444"]

function pct(v: number) { return (v * 100).toFixed(1) + "%" }

export default function PortfolioStressTester({ window }: { window: number }) {
  const [weights, setWeights] = useState<Record<string, string>>({
    SPY: "0.4", TLT: "0.3", GLD: "0.3", "BTC-USD": "0.0",
  })
  const [result, setResult]   = useState<StressResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  const totalWeight = Object.values(weights)
    .reduce((s, v) => s + (parseFloat(v) || 0), 0)

  function addAsset(symbol: string) {
    if (weights[symbol] !== undefined) return
    setWeights(prev => ({ ...prev, [symbol]: "0" }))
  }

  function removeAsset(symbol: string) {
    setWeights(prev => {
      const next = { ...prev }
      delete next[symbol]
      return next
    })
  }

  async function runStress() {
    setError("")
    const parsed: Record<string, number> = {}
    for (const [k, v] of Object.entries(weights)) {
      const n = parseFloat(v)
      if (isNaN(n) || n < 0) {
        setError(`Invalid weight for ${k}`)
        return
      }
      if (n > 0) parsed[k] = n
    }

    const total = Object.values(parsed).reduce((s, v) => s + v, 0)
    if (Math.abs(total - 1) > 0.01) {
      setError(`Weights sum to ${(total * 100).toFixed(1)}% — must equal 100%`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("http://localhost:8080/api/portfolio-stress", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ weights: parsed, window_days: window }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "request failed")
        return
      }
      setResult(data)
    } catch {
      setError("could not connect to server")
    } finally {
      setLoading(false)
    }
  }

  const weightTotal = Math.round(totalWeight * 100)

  return (
    <div className="space-y-5">

      {/* weight inputs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Portfolio Weights</p>
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
            weightTotal === 100
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}>
            {weightTotal}% / 100%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {Object.entries(weights).map(([symbol, val]) => (
            <div key={symbol} className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1.5">
              <button
                onClick={() => removeAsset(symbol)}
                className="text-gray-300 hover:text-red-400 text-xs font-bold"
              >×</button>
              <span className="font-mono text-xs font-semibold text-gray-700 flex-1">{symbol}</span>
              <input
                type="number"
                min="0" max="1" step="0.05"
                value={val}
                onChange={e => setWeights(prev => ({ ...prev, [symbol]: e.target.value }))}
                className="w-14 text-xs font-mono text-right bg-white border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-blue-300"
              />
            </div>
          ))}
        </div>

        {/* add asset */}
        <div className="flex gap-1 flex-wrap mb-3">
          {AVAILABLE_ASSETS.filter(a => !weights[a]).map(a => (
            <button
              key={a}
              onClick={() => addAsset(a)}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded font-mono"
            >
              + {a}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        <button
          onClick={runStress}
          disabled={loading || weightTotal !== 100}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Running..." : "Run Stress Test"}
        </button>
      </div>

      {/* results */}
      {result && (
        <div className="space-y-5 border-t border-gray-100 pt-5">

          {/* top stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg px-4 py-3">
              <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">Portfolio Vol</p>
              <p className="text-2xl font-bold font-mono text-blue-700 mt-1">
                {pct(result.portfolio_vol)}
              </p>
              <p className="text-xs text-blue-400">annualized</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Undiversified</p>
              <p className="text-2xl font-bold font-mono text-gray-700 mt-1">
                {pct(result.undiversified_vol)}
              </p>
              <p className="text-xs text-gray-400">if uncorrelated</p>
            </div>
            <div className={`rounded-lg px-4 py-3 ${
              result.diversification_ratio > 1.3
                ? "bg-green-50" : "bg-orange-50"
            }`}>
              <p className={`text-xs font-medium uppercase tracking-wide ${
                result.diversification_ratio > 1.3
                  ? "text-green-500" : "text-orange-500"
              }`}>Diversification</p>
              <p className={`text-2xl font-bold font-mono mt-1 ${
                result.diversification_ratio > 1.3
                  ? "text-green-700" : "text-orange-600"
              }`}>
                {result.diversification_ratio.toFixed(2)}x
              </p>
              <p className={`text-xs ${
                result.diversification_ratio > 1.3
                  ? "text-green-400" : "text-orange-400"
              }`}>
                {result.diversification_ratio > 1.3 ? "healthy" : "low — correlations elevated"}
              </p>
            </div>
          </div>

          {/* regime vols */}
          {result.regime_vols?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                Portfolio Vol by Regime
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={result.regime_vols}
                  margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis
                    tickFormatter={v => pct(v)}
                    tick={{ fontSize: 10 }}
                    domain={[0, "auto"]}
                  />
                  <ReferenceLine
                    y={result.portfolio_vol}
                    stroke="#3b82f6"
                    strokeDasharray="4 2"
                    label={{ value: "current", fontSize: 10, fill: "#3b82f6" }}
                  />
                  <Tooltip formatter={(value) => typeof value === "number" ? pct(value) : ""} />
                  <Bar dataKey="vol" radius={[4, 4, 0, 0]}>
                    {result.regime_vols.map((r, i) => (
                      <Cell key={`${r.label}-${i}`} fill={REGIME_COLORS[r.cluster_id % REGIME_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 mt-1">
                Blue dashed line = current portfolio vol. 
                Each bar = expected vol if we entered that regime.
              </p>
            </div>
          )}

          {/* individual asset vols */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Individual Asset Volatilities
            </p>
            <div className="space-y-1">
              {result.asset_vols.map((a, i) => (
                <div key={`${a.symbol}-${i}`} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-gray-700 w-20">{a.symbol}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${Math.min(a.vol * 200, 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-gray-600 w-14 text-right">
                    {pct(a.vol)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* analogue returns */}
          {result.analogue_returns?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                Portfolio Return on Analogue Dates
              </p>
              <div className="space-y-1">
                {result.analogue_returns.map((a, i) => (
                  <div key={`${a.date}-${i}`} className="flex items-center justify-between
                    text-xs px-3 py-1.5 rounded hover:bg-gray-50">
                    <span className="font-mono text-gray-600">{a.date}</span>
                    <span className={`font-mono font-semibold ${
                      a.return > 0 ? "text-green-600" :
                      a.return < 0 ? "text-red-500" : "text-gray-400"
                    }`}>
                      {a.return > 0 ? "+" : ""}{(a.return * 100).toFixed(3)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Next-day return of this portfolio on the most structurally similar historical dates.
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}