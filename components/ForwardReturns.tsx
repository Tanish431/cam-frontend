"use client"

import { useEffect, useState } from "react"

interface FwdSummary {
  symbol:        string
  horizon_days:  number
  avg_return:    number
  median_return: number
  win_rate:      number
  sample_count:  number
}

interface FwdEvent {
  symbol:       string
  event_date:   string
  horizon_days: number
  return:       number
}

interface ForwardData {
  summary: FwdSummary[]
  events:  FwdEvent[]
}

function ReturnCell({ value }: { value: number }) {
  const pct   = (value * 100).toFixed(2)
  const color = value > 0 ? "text-green-600" : value < 0 ? "text-red-500" : "text-gray-400"
  return (
    <span className={`font-mono font-semibold ${color}`}>
      {value > 0 ? "+" : ""}{pct}%
    </span>
  )
}

function WinRateCell({ value }: { value: number }) {
  const color = value > 0.55 ? "text-green-600" : value < 0.45 ? "text-red-500" : "text-gray-500"
  return <span className={`font-mono ${color}`}>{(value * 100).toFixed(0)}%</span>
}

// 95% CI: mean ± 1.96 * (stddev / sqrt(n))
// we approximate stddev from avg and win_rate using normal approximation
function ciWidth(avgReturn: number, winRate: number, n: number): number {
  // rough stddev estimate: use win_rate as proxy for spread
  const spread = Math.abs(avgReturn) / Math.max(Math.abs(winRate - 0.5) * 2, 0.1)
  return 1.96 * spread / Math.sqrt(n)
}

function HorizonLabel({ days }: { days: number }) {
  const labels: Record<number, string> = {
    5:  "1 week",
    10: "2 weeks",
    20: "1 month",
  }
  return (
    <span className="text-xs text-gray-400 ml-1">
      {labels[days] ?? `${days}d`}
    </span>
  )
}

export default function ForwardReturns({
  window,
}: {
  window:  number
}) {
  const [data, setData]       = useState<ForwardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`http://localhost:8080/api/forward-returns?window=${window}`)
      .then(r => r.json())
      .then(d => {
        if (d && typeof d === "object" && "summary" in d) setData(d)
      })
      .finally(() => setLoading(false))
  }, [window])

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>
  if (!data?.summary?.length) return (
    <div className="text-gray-400 text-sm">No forward return data for this pair.</div>
  )

  const symbols = [...new Set(data.summary.map(d => d.symbol))]

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        Historical returns following a {window}d correlation anomaly (|z| &gt; 2σ)
      </p>

      {symbols.map(sym => {
        const rows = data.summary
          .filter(d => d.symbol === sym)
          .sort((a, b) => a.horizon_days - b.horizon_days)

        return (
          <div key={sym}>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono font-bold text-gray-800">{sym}</span>
              <span className="text-xs text-gray-400">
                {rows[0]?.sample_count ?? 0} signal instances
              </span>
            </div>

            <div className="space-y-1">
              {rows.map((r, i) => {
                const key    = `${sym}-${r.horizon_days}-${i}`
                const isOpen = expanded === key
                const ci     = ciWidth(r.avg_return, r.win_rate, r.sample_count)

                // get individual events for this symbol + horizon
                const events = (data.events ?? [])
                  .filter(e =>
                    e.symbol === sym &&
                    e.horizon_days === r.horizon_days
                  )
                  .sort((a, b) => b.event_date.localeCompare(a.event_date))

                return (
                  <div key={key} className="border border-gray-100 rounded-lg overflow-hidden">
                    {/* summary row */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : key)}
                      className="w-full flex items-center justify-between
                        px-3 py-2 hover:bg-gray-50 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">
                          {r.horizon_days}d
                        </span>
                        <HorizonLabel days={r.horizon_days} />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-gray-400">avg</div>
                          <ReturnCell value={r.avg_return} />
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">win rate</div>
                          <WinRateCell value={r.win_rate} />
                        </div>
                        <span className="text-gray-300 text-xs ml-2">
                          {isOpen ? "▲" : "▼"}
                        </span>
                      </div>
                    </button>

                    {/* collapsible detail */}
                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50 px-3 py-3 space-y-3">
                        {/* CI and stats */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white rounded px-2 py-1.5">
                            <p className="text-xs text-gray-400">Mean return</p>
                            <ReturnCell value={r.avg_return} />
                          </div>
                          <div className="bg-white rounded px-2 py-1.5">
                            <p className="text-xs text-gray-400">95% CI</p>
                            <p className="text-xs font-mono text-gray-600">
                              [{((r.avg_return - ci) * 100).toFixed(2)}%,{" "}
                              {((r.avg_return + ci) * 100).toFixed(2)}%]
                            </p>
                          </div>
                          <div className="bg-white rounded px-2 py-1.5">
                            <p className="text-xs text-gray-400">Observations</p>
                            <p className="text-sm font-mono font-bold text-gray-700">
                              {r.sample_count}
                            </p>
                          </div>
                        </div>

                        {/* individual event dates */}
                        {events.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">
                              Individual signal dates
                            </p>
                            <div className="space-y-0.5 max-h-40 overflow-y-auto">
                              {events.map((e, i) => (
                                <div key={`${e.event_date}-${i}`}
                                  className="flex justify-between text-xs px-2 py-1
                                    bg-white rounded hover:bg-gray-50">
                                  <span className="font-mono text-gray-500">
                                    {e.event_date}
                                  </span>
                                  <ReturnCell value={e.return} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-gray-400">
                          Median: {(r.median_return * 100).toFixed(2)}% ·
                          Win rate: {(r.win_rate * 100).toFixed(0)}%
                          {r.sample_count < 10 && (
                            <span className="text-orange-500 ml-2">
                              ⚠ Small sample — treat with caution
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}