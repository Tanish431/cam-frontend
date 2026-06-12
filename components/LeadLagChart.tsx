"use client"

import { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer, Cell
} from "recharts"

interface LeadLagPoint {
  lag_days: number
  correlation: number
}

function lagLabel(lag: number, symbolA: string, symbolB: string): string {
  if (lag === 0) return "Concurrent"
  if (lag < 0)  return `${symbolA} leads ${symbolB} by ${Math.abs(lag)}d`
  return              `${symbolB} leads ${symbolA} by ${lag}d`
}

export default function LeadLagChart({
  symbolA,
  symbolB,
}: {
  symbolA: string
  symbolB: string
}) {
  const [data, setData]       = useState<LeadLagPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [peak, setPeak]       = useState<LeadLagPoint | null>(null)

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      const a = encodeURIComponent(symbolA)
      const b = encodeURIComponent(symbolB)

      try {
        const d: LeadLagPoint[] = await fetch(
          `http://localhost:8080/api/lead-lag/${a}/${b}`,
        ).then((r) => r.json())

        if (!active) return

        setData(d)
        const nonZero = d.filter((p) => p.lag_days !== 0)
        if (nonZero.length) {
          const p = nonZero.reduce((best, cur) =>
            Math.abs(cur.correlation) > Math.abs(best.correlation) ? cur : best,
          )
          setPeak(p)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [symbolA, symbolB])

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>
  if (!data.length) return <div className="text-gray-400 text-sm">No lead-lag data.</div>

  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">
        Cross-correlation at lags -10 to +10 days (252-day window)
      </p>
      {peak && (
        <div className="mb-3 text-xs bg-blue-50 border border-blue-100 rounded px-3 py-2 text-blue-700">
          <strong>Strongest signal:</strong> {lagLabel(peak.lag_days, symbolA, symbolB)} 
          {" "}(r = {peak.correlation.toFixed(3)})
        </div>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="lag_days"
            tick={{ fontSize: 10 }}
            tickFormatter={v => v === 0 ? "0" : `${v > 0 ? "+" : ""}${v}`}
          />
          <YAxis domain={[-0.5, 0.5]} tick={{ fontSize: 10 }} />
          <ReferenceLine y={0} stroke="#94a3b8" />
          <Tooltip
            formatter={(value) =>
              typeof value === "number" ? value.toFixed(3) : ""
            }
            labelFormatter={lag =>
              `Lag ${lag}: ${lagLabel(Number(lag), symbolA, symbolB)}`
            }
            contentStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="correlation" radius={[2, 2, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell
                key={`${entry.lag_days}-${idx}`}
                fill={
                  entry.lag_days === 0
                    ? "#94a3b8"
                    : entry.correlation > 0
                    ? "#22c55e"
                    : "#ef4444"
                }
                opacity={
                  peak && entry.lag_days === peak.lag_days ? 1 : 0.6
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-xs text-gray-400">
        <span>← negative lag: {symbolA} leads</span>
        <span>positive lag: {symbolB} leads →</span>
      </div>
    </div>
  )
}