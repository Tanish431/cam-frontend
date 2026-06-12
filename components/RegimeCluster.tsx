"use client"

import { useEffect, useState } from "react"

interface ClusterProfile {
  cluster_id: number
  label: string
  description: string
  avg_zscore: number
  sample_count: number
}

interface TimelineEntry {
  time: string
  cluster_id: number
  label: string
}

interface ClusterData {
  current: { cluster_id: number; label: string; desc: string }
  timeline: TimelineEntry[]
  profiles: ClusterProfile[]
}

const CLUSTER_COLORS = [
  { bg: "bg-green-100",  text: "text-green-700",  bar: "#22c55e" },
  { bg: "bg-blue-100",   text: "text-blue-700",   bar: "#3b82f6" },
  { bg: "bg-orange-100", text: "text-orange-700", bar: "#f97316" },
  { bg: "bg-red-100",    text: "text-red-700",    bar: "#ef4444" },
]

function RegimeTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  if (!timeline.length) return null

  // show last 120 days as colored blocks
  const recent = [...timeline].reverse().slice(0, 120)

  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">Last 120 days</p>
      <div className="flex gap-px flex-wrap">
        {recent.map((entry, i) => {
          const color = CLUSTER_COLORS[entry.cluster_id % CLUSTER_COLORS.length]
          return (
            <div
              key={i}
              className={`w-2 h-6 rounded-sm ${color.bg} opacity-80`}
              title={`${entry.time}: ${entry.label}`}
            />
          )
        })}
      </div>
      <div className="flex gap-3 mt-2 flex-wrap">
        {CLUSTER_COLORS.slice(0, 4).map((c, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm ${c.bg}`} />
            <span className="text-xs text-gray-500">Cluster {i}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegimeCluster({ window }: { window: number }) {
  const [data, setData]       = useState<ClusterData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`http://localhost:8080/api/regime-clusters?window=${window}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [window])

  if (loading) return <div className="text-gray-400 text-sm">Running K-Means...</div>
  if (!data)   return <div className="text-gray-400 text-sm">No cluster data.</div>

  const current = data.current
  const color = CLUSTER_COLORS[current?.cluster_id % CLUSTER_COLORS.length]

  return (
    <div className="space-y-4">

      {/* current regime badge */}
      {current && (
        <div className={`rounded-lg px-4 py-3 ${color.bg}`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wide ${color.text}`}>
              Current Regime
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${color.bg} ${color.text} border border-current`}>
              Cluster {current.cluster_id}
            </span>
          </div>
          <p className={`font-bold text-lg mt-0.5 ${color.text}`}>{current.label}</p>
          <p className="text-xs text-gray-600 mt-1">{current.desc}</p>
        </div>
      )}

      {/* timeline */}
      <RegimeTimeline timeline={data.timeline} />

      {/* all cluster profiles */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">All Clusters</p>
        {data.profiles.map(p => {
          const c = CLUSTER_COLORS[p.cluster_id % CLUSTER_COLORS.length]
          return (
            <div key={p.cluster_id}
              className={`rounded-lg px-3 py-2 ${
                current?.cluster_id === p.cluster_id ? c.bg : "bg-gray-50"
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${
                    current?.cluster_id === p.cluster_id ? c.text : "text-gray-700"
                  }`}>
                    {p.label}
                  </span>
                  {current?.cluster_id === p.cluster_id && (
                    <span className="text-xs bg-white px-1.5 py-0.5 rounded text-gray-500">now</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>avg|z|={p.avg_zscore.toFixed(2)}</span>
                  <span>{p.sample_count}d</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}