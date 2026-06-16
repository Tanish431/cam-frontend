"use client"

import { useEffect, useState } from "react"

interface ChangePoint {
  change_date:   string
  symbol_a:      string
  symbol_b:      string
  zscore_before: number
  zscore_after:  number
  magnitude:     number
}

function MagnitudeBadge({ value }: { value: number }) {
  if (value > 2.5) return (
    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
      Major {value.toFixed(2)}
    </span>
  )
  if (value > 1.5) return (
    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
      Moderate {value.toFixed(2)}
    </span>
  )
  return (
    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
      Minor {value.toFixed(2)}
    </span>
  )
}

function ShiftArrow({ before, after }: { before: number; after: number }) {
  const dir = after > before ? "↑" : "↓"
  const color = after > before ? "text-red-500" : "text-green-600"
  return (
    <span className="flex items-center gap-1 font-mono text-xs">
      <span className="text-gray-400">{before.toFixed(2)}</span>
      <span className={`font-bold ${color}`}>{dir}</span>
      <span className="text-gray-700">{after.toFixed(2)}</span>
    </span>
  )
}

export default function ChangePoints({ window }: { window: number }) {
  const [data, setData]       = useState<ChangePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<string>("all")

  useEffect(() => {
    setLoading(true)
    fetch(`http://localhost:8080/api/change-points?window=${window}`)
      .then(r => r.json())
      .then((d) => {
        if (Array.isArray(d)) setData(d)
      })
      .finally(() => setLoading(false))
  }, [window])

  if (loading) return <div className="text-gray-400 text-sm">Detecting breakpoints...</div>
  if (!data.length) return <div className="text-gray-400 text-sm">No change points detected.</div>

  // get unique symbols for filter
  const symbols = ["all", ...new Set(data.flatMap(d => [d.symbol_a, d.symbol_b]))]

  const filtered = filter === "all"
    ? data
    : data.filter(d => d.symbol_a === filter || d.symbol_b === filter)

  // group by date for timeline view
  const byDate = filtered.reduce((acc, cp) => {
    const d = cp.change_date
    if (!acc[d]) acc[d] = []
    acc[d].push(cp)
    return acc
  }, {} as Record<string, ChangePoint[]>)

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          PELT algorithm · BIC penalty · magnitude = |z-score shift|
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Filter:</span>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1
              focus:outline-none focus:border-blue-300"
          >
            {symbols.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold font-mono text-gray-800">{filtered.length}</p>
          <p className="text-xs text-gray-400">total breakpoints</p>
        </div>
        <div className="bg-red-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold font-mono text-red-700">
            {filtered.filter(d => d.magnitude > 2.5).length}
          </p>
          <p className="text-xs text-red-400">major shifts</p>
        </div>
        <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold font-mono text-blue-700">
            {sortedDates[0] ?? "—"}
          </p>
          <p className="text-xs text-blue-400">most recent</p>
        </div>
      </div>

      {/* timeline */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedDates.map(date => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-xs font-semibold text-gray-600 font-mono">{date}</span>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">{byDate[date].length} pair{byDate[date].length > 1 ? "s" : ""}</span>
            </div>
            <div className="ml-4 space-y-1">
              {byDate[date]
                .sort((a, b) => b.magnitude - a.magnitude)
                .map((cp, i) => (
                  <div key={`${cp.symbol_a}-${cp.symbol_b}-${i}`}
                    className="flex items-center justify-between px-3 py-2
                      bg-white rounded border border-gray-100 hover:border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-gray-800 text-sm">
                        {cp.symbol_a}/{cp.symbol_b}
                      </span>
                      <MagnitudeBadge value={cp.magnitude} />
                    </div>
                    <ShiftArrow before={cp.zscore_before} after={cp.zscore_after} />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        Each entry shows the Z-score before → after the structural break.
        ↑ = correlation became more anomalous · ↓ = returned toward normal.
      </p>
    </div>
  )
}