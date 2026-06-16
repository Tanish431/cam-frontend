"use client"

import { useEffect, useState } from "react"

interface Exposure {
  symbol:    string
  factor:    string
  beta:      number
  r_squared: number
}

interface AssetRow {
  symbol:      string
  r_squared:   number
  market_beta: number
  vix_corr:    number
  vol_ratio:   number
  max_drawdown: number
}

function MetricBar({
  value, min, max, reverse = false
}: {
  value: number
  min: number
  max: number
  reverse?: boolean
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  const high = reverse ? pct < 40 : pct > 60
  const low  = reverse ? pct > 60 : pct < 40
  const color = high ? "bg-green-400" : low ? "bg-red-400" : "bg-gray-300"
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-600 w-12">
        {value.toFixed(2)}
      </span>
    </div>
  )
}

function RSquaredBadge({ value }: { value: number }) {
  const pct   = (value * 100).toFixed(0)
  const color = value > 0.7
    ? "bg-green-100 text-green-700"
    : value > 0.4
    ? "bg-yellow-100 text-yellow-700"
    : "bg-gray-100 text-gray-500"
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${color}`}>
      R²={pct}%
    </span>
  )
}

export default function FactorExposure() {
  const [data, setData]         = useState<AssetRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    fetch("http://localhost:8080/api/factor-exposures")
      .then(r => r.json())
      .then((rows: Exposure[]) => {
        if (!Array.isArray(rows)) return
        const map = new Map<string, AssetRow>()
        for (const row of rows) {
          if (!map.has(row.symbol)) {
            map.set(row.symbol, {
              symbol:       row.symbol,
              r_squared:    row.r_squared,
              market_beta:  0,
              vix_corr:     0,
              vol_ratio:    0,
              max_drawdown: 0,
            })
          }
          const entry = map.get(row.symbol)!
          entry.r_squared = row.r_squared
          if (row.factor === "market_beta")   entry.market_beta  = row.beta
          if (row.factor === "vix_corr")      entry.vix_corr     = row.beta
          if (row.factor === "vol_ratio")     entry.vol_ratio    = row.beta
          if (row.factor === "max_drawdown")  entry.max_drawdown = row.beta
        }
        setData(Array.from(map.values()))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 text-sm">Computing metrics...</div>
  if (!data.length) return <div className="text-gray-400 text-sm">No data yet.</div>

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">
        Market beta and risk characteristics computed from 252 days of returns.
        R² = how much variance is explained by the market.
      </p>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 pr-4 text-xs text-gray-400 font-medium">Asset</th>
              <th className="text-left py-2 pr-4 text-xs text-gray-400 font-medium">R²</th>
              <th className="text-left py-2 pr-6 text-xs text-gray-400 font-medium">
                Market β
                <span className="ml-1 text-gray-300 font-normal">vs SPY</span>
              </th>
              <th className="text-left py-2 pr-6 text-xs text-gray-400 font-medium">
                VIX Corr
                <span className="ml-1 text-gray-300 font-normal">60d</span>
              </th>
              <th className="text-left py-2 pr-6 text-xs text-gray-400 font-medium">
                Vol Ratio
                <span className="ml-1 text-gray-300 font-normal">20d/252d</span>
              </th>
              <th className="text-left py-2 text-xs text-gray-400 font-medium">
                Max DD
                <span className="ml-1 text-gray-300 font-normal">252d</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map(a => (
              <tr
                key={a.symbol}
                onClick={() => setSelected(selected === a.symbol ? null : a.symbol)}
                className={`cursor-pointer transition-colors ${
                  selected === a.symbol ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <td className="py-3 pr-4 font-mono font-bold text-gray-800 w-24">
                  {a.symbol}
                </td>
                <td className="py-3 pr-4">
                  <RSquaredBadge value={a.r_squared} />
                </td>
                <td className="py-3 pr-6">
                  <MetricBar value={a.market_beta} min={-2} max={2} />
                </td>
                <td className="py-3 pr-6">
                  {/* high VIX corr = risky, low/negative = defensive */}
                  <MetricBar value={a.vix_corr} min={-1} max={1} reverse />
                </td>
                <td className="py-3 pr-6">
                  {/* vol ratio > 1 = currently stressed */}
                  <MetricBar value={a.vol_ratio} min={0} max={3} reverse />
                </td>
                <td className="py-3">
                  {/* lower drawdown = better */}
                  <MetricBar value={a.max_drawdown} min={0} max={0.5} reverse />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* drilldown */}
      {selected && (() => {
        const a = data.find(d => d.symbol === selected)
        if (!a) return null
        return (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono font-bold text-blue-800">{a.symbol}</span>
              <RSquaredBadge value={a.r_squared} />
              {a.r_squared < 0.3 && (
                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                  High idiosyncratic risk
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Market Beta",
                  value: a.market_beta.toFixed(3),
                  note: a.market_beta > 1.2
                    ? "Amplifies market moves"
                    : a.market_beta < 0
                    ? "Moves against market"
                    : "Tracks market",
                },
                {
                  label: "VIX Correlation",
                  value: a.vix_corr.toFixed(3),
                  note: a.vix_corr < -0.3
                    ? "Defensive — rises when fear spikes"
                    : a.vix_corr > 0.3
                    ? "Risk-on — falls when fear spikes"
                    : "Low VIX sensitivity",
                },
                {
                  label: "Vol Ratio",
                  value: a.vol_ratio.toFixed(3),
                  note: a.vol_ratio > 1.5
                    ? "Currently more volatile than usual"
                    : a.vol_ratio < 0.8
                    ? "Currently calmer than usual"
                    : "Normal volatility regime",
                },
                {
                  label: "Max Drawdown",
                  value: (a.max_drawdown * 100).toFixed(1) + "%",
                  note: a.max_drawdown > 0.3
                    ? "High tail risk over past year"
                    : "Contained drawdown",
                },
              ].map(item => (
                <div key={item.label} className="bg-white rounded px-3 py-2">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="font-mono font-bold text-lg text-gray-800">{item.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      <p className="text-xs text-gray-400 mt-3">
        VIX corr: negative = defensive · Vol ratio &gt;1 = elevated stress · 
        Click any row for interpretation.
      </p>
    </div>
  )
}