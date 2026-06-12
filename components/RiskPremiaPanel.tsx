"use client"

import { useEffect, useState } from "react"

interface PremiaEntry {
  symbol: string
  factor: string
  raw_score: number
  zscore: number
  rank: number
}

function RankBadge({ rank, total }: { rank: number; total: number }) {
  const pct = rank / total
  if (pct <= 0.25) return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">
      {rank}
    </span>
  )
  if (pct >= 0.75) return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
      {rank}
    </span>
  )
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
      {rank}
    </span>
  )
}

function ZBar({ z }: { z: number }) {
  const clamped = Math.max(-2.5, Math.min(2.5, z))
  const pct = ((clamped + 2.5) / 5) * 100
  const color = z > 0.5 ? "bg-green-400" : z < -0.5 ? "bg-red-400" : "bg-gray-300"
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-400">{z.toFixed(2)}</span>
    </div>
  )
}

const FACTORS = ["carry", "defensive", "low_vol"] as const
const FACTOR_LABELS: Record<string, string> = {
  carry:     "Carry",
  defensive: "Defensive",
  low_vol:   "Low Vol",
}
const FACTOR_DESC: Record<string, string> = {
  carry:     "Return per unit of risk",
  defensive: "Holds up during stress",
  low_vol:   "Lowest realized volatility",
}

export default function RiskPremiaPanel() {
  const [data, setData] = useState<PremiaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"carry" | "defensive" | "low_vol">("carry")

  useEffect(() => {
    fetch("http://localhost:8080/api/risk-premia")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 text-sm">Loading risk premia...</div>

  const deduped = Array.from(
    data.reduce((entries, entry) => {
      const key = `${entry.factor}:${entry.symbol}`
      const current = entries.get(key)
      if (!current || entry.rank < current.rank) {
        entries.set(key, entry)
      }
      return entries
    }, new Map<string, PremiaEntry>()).values()
  )
  const total = new Set(deduped.filter(d => d.factor === activeTab).map(d => d.symbol)).size
  const filtered = deduped
    .filter(d => d.factor === activeTab)
    .sort((a, b) => a.rank - b.rank || a.symbol.localeCompare(b.symbol))

  return (
    <div>
      {/* factor tabs */}
      <div className="flex gap-1 mb-4">
        {FACTORS.map(f => (
          <button
            key={f}
            onClick={() => setActiveTab(f)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              activeTab === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {FACTOR_LABELS[f]}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-3">{FACTOR_DESC[activeTab]}</p>

      {/* rankings table */}
      <div className="space-y-1">
        {filtered.map(entry => (
          <div key={`${entry.symbol}-${entry.factor}`}
            className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <RankBadge rank={entry.rank} total={total} />
              <span className="font-mono font-semibold text-gray-800 w-20">{entry.symbol}</span>
            </div>
            <div className="flex items-center gap-4">
              <ZBar z={entry.zscore} />
              <span className="text-xs font-mono text-gray-500 w-16 text-right">
                {entry.raw_score.toFixed(3)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
