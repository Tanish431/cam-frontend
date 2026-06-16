"use client"

import { useEffect, useState } from "react"

interface AssetReturns {
  [horizon: string]: number
}

interface AnalogueOutcome {
  date:          string
  similarity:    number
  asset_returns: Record<string, AssetReturns>
}

interface TransitionInstance {
  transition_date: string
  from_label:      string
  to_label:        string
  asset_returns:   Record<string, AssetReturns>
}

interface TransitionSummary {
  from_label:   string
  to_label:     string
  probability:  number
  instances:    TransitionInstance[]
  avg_returns:  Record<string, AssetReturns>
}

interface WhatHappensNextData {
  analogues:  AnalogueOutcome[]
  transition: TransitionSummary | null
  window:     number
  as_of:      string
}

const HORIZONS = ["5d", "10d", "20d"]

function ReturnPill({ value }: { value: number | undefined }) {
  if (value === undefined || isNaN(value)) return <span className="text-gray-300 text-xs">—</span>
  const pct   = (value * 100).toFixed(1)
  const color = value > 0.01  ? "bg-green-100 text-green-700" :
                value < -0.01 ? "bg-red-100 text-red-600"     :
                                "bg-gray-100 text-gray-500"
  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${color}`}>
      {value > 0 ? "+" : ""}{pct}%
    </span>
  )
}

function AssetReturnGrid({
  returns,
  title,
}: {
  returns: Record<string, AssetReturns>
  title?:  string
}) {
  const symbols = Object.keys(returns).sort()
  if (!symbols.length) return null

  return (
    <div>
      {title && <p className="text-xs text-gray-400 mb-2">{title}</p>}
      <div className="overflow-auto">
        <table className="text-xs w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-1 pr-3 text-gray-400 font-medium w-20">Asset</th>
              {HORIZONS.map(h => (
                <th key={h} className="text-center py-1 px-2 text-gray-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {symbols.map(sym => (
              <tr key={sym} className="hover:bg-gray-50">
                <td className="py-1.5 pr-3 font-mono font-bold text-gray-700">{sym}</td>
                {HORIZONS.map(h => (
                  <td key={h} className="py-1.5 px-2 text-center">
                    <ReturnPill value={returns[sym]?.[h]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SimilarityBadge({ value }: { value: number }) {
  const pct   = (value * 100).toFixed(1)
  const color = value > 0.93 ? "bg-red-100 text-red-700"    :
                value > 0.88 ? "bg-orange-100 text-orange-600" :
                               "bg-blue-100 text-blue-600"
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-semibold ${color}`}>
      {pct}% similar
    </span>
  )
}

export default function WhatHappensNext({ window }: { window: number }) {
  const [data, setData]           = useState<WhatHappensNextData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<"analogues" | "transition">("analogues")
  const [expandedAnalogue, setExpandedAnalogue] = useState<string | null>(null)
  const [expandedTransition, setExpandedTransition] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`http://localhost:8080/api/what-happens-next?window=${window}`)
      .then(r => r.json())
      .then(d => { if (d && d.as_of) setData(d) })
      .finally(() => setLoading(false))
  }, [window])

  if (loading) return (
    <div className="text-gray-400 text-sm">Analyzing historical outcomes...</div>
  )
  if (!data) return (
    <div className="text-gray-400 text-sm">No data available.</div>
  )

  return (
    <div className="space-y-4">

      {/* header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          As of <span className="font-mono text-gray-600">{data.as_of}</span>
          {" · "}{window}d window
        </p>
        <div className="flex gap-1">
          {(["analogues", "transition"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab === "analogues" ? "Analogue Outcomes" : "Transition Outcomes"}
            </button>
          ))}
        </div>
      </div>

      {/* analogues tab */}
      {activeTab === "analogues" && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">
            What happened after the {data.analogues.length} most similar
            historical dates (90-day minimum separation)
          </p>

          {data.analogues.length === 0 && (
            <p className="text-gray-400 text-sm">No analogues found.</p>
          )}

          {data.analogues.map((a) => {
            const isOpen = expandedAnalogue === a.date
            return (
              <div key={a.date}
                className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedAnalogue(isOpen ? null : a.date)}
                  className="w-full flex items-center justify-between
                    px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-gray-800">{a.date}</span>
                    <SimilarityBadge value={a.similarity} />
                  </div>
                  <div className="flex items-center gap-3">
                    {/* preview best/worst 20d */}
                    <div className="flex gap-1 items-center">
                      {Object.entries(a.asset_returns)
                        .map(([sym, h]) => ({ sym, ret: h["20d"] ?? 0 }))
                        .sort((a, b) => b.ret - a.ret)
                        .slice(0, 2)
                        .map(({ sym, ret }) => (
                          <span key={sym} className="text-xs">
                            <span className="text-gray-400">{sym}</span>{" "}
                            <ReturnPill value={ret} />
                          </span>
                        ))}
                    </div>
                    <span className="text-gray-300 text-xs">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <AssetReturnGrid
                      returns={a.asset_returns}
                      title="Forward returns after this analogue date"
                    />
                  </div>
                )}
              </div>
            )
          })}

          {/* aggregate across all analogues */}
          {data.analogues.length > 1 && (() => {
            const agg: Record<string, AssetReturns> = {}
            for (const a of data.analogues) {
              for (const [sym, hMap] of Object.entries(a.asset_returns)) {
                if (!agg[sym]) agg[sym] = {}
                for (const [h, v] of Object.entries(hMap)) {
                  agg[sym][h] = (agg[sym][h] ?? 0) + v / data.analogues.length
                }
              }
            }
            return (
              <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
                <p className="text-xs font-semibold text-blue-700 mb-3">
                  Average across all {data.analogues.length} analogues
                </p>
                <AssetReturnGrid returns={agg} />
              </div>
            )
          })()}
        </div>
      )}

      {/* transition tab */}
      {activeTab === "transition" && (
        <div className="space-y-3">
          {!data.transition ? (
            <p className="text-gray-400 text-sm">
              No historical transitions out of the current regime yet.
            </p>
          ) : (
            <>
              {/* transition header */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Current</p>
                  <p className="font-bold text-gray-800">{data.transition.from_label}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full h-px bg-gray-300 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      bg-white px-2 text-xs text-gray-500 font-mono">
                      {(data.transition.probability * 100).toFixed(0)}%
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {data.transition.instances.length} historical instance{data.transition.instances.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Most likely next</p>
                  <p className="font-bold text-blue-700">{data.transition.to_label}</p>
                </div>
              </div>

              {/* average returns during transition */}
              {Object.keys(data.transition.avg_returns).length > 0 && (
                <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
                  <p className="text-xs font-semibold text-blue-700 mb-3">
                    Average asset returns during {data.transition.from_label} →{" "}
                    {data.transition.to_label} transitions
                  </p>
                  <AssetReturnGrid returns={data.transition.avg_returns} />
                </div>
              )}

              {/* individual instances */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium">Individual instances</p>
                {data.transition.instances.map((inst, i) => {
                  const isOpen = expandedTransition === inst.transition_date
                  return (
                    <div key={`${inst.transition_date}-${i}`}
                      className="border border-gray-100 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedTransition(isOpen ? null : inst.transition_date)}
                        className="w-full flex items-center justify-between
                          px-4 py-2.5 hover:bg-gray-50 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-gray-700">
                            {inst.transition_date}
                          </span>
                          <span className="text-xs text-gray-400">
                            {inst.from_label} → {inst.to_label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {Object.entries(inst.asset_returns)
                            .map(([sym, h]) => ({ sym, ret: h["20d"] ?? 0 }))
                            .sort((a, b) => b.ret - a.ret)
                            .slice(0, 2)
                            .map(({ sym, ret }) => (
                              <span key={sym} className="text-xs">
                                <span className="text-gray-400">{sym}</span>{" "}
                                <ReturnPill value={ret} />
                              </span>
                            ))}
                          <span className="text-gray-300 text-xs">{isOpen ? "▲" : "▼"}</span>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                          <AssetReturnGrid
                            returns={inst.asset_returns}
                            title={`Returns after transition on ${inst.transition_date}`}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}