"use client"

import { useEffect, useState } from "react"

interface Analogue {
  date: string
  similarity: number
}

function SimilarityBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  const color =
    value > 0.95 ? "bg-red-500" :
    value > 0.90 ? "bg-orange-400" :
    value > 0.85 ? "bg-yellow-400" : "bg-blue-300"
  return (
    <div className="flex items-center gap-2">
      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-600">{(value * 100).toFixed(1)}%</span>
    </div>
  )
}

function getSimilarityLabel(v: number): { label: string; color: string } {
  if (v > 0.97) return { label: "Near identical", color: "text-red-600 font-bold" }
  if (v > 0.93) return { label: "Very similar",   color: "text-orange-500 font-semibold" }
  if (v > 0.88) return { label: "Similar",         color: "text-yellow-600" }
  return               { label: "Moderate",         color: "text-gray-400" }
}

export default function AnalogueFinder({ window }: { window: number }) {
  const [analogues, setAnalogues] = useState<Analogue[]>([])
  const [loading, setLoading]     = useState(true)
  const [today, setToday]         = useState("")

  useEffect(() => {
    setLoading(true)
    fetch(`http://localhost:8080/api/analogues?window=${window}`)
      .then(r => r.json())
      .then((data: Analogue[]) => {
        setAnalogues(data)
        setToday(new Date().toISOString().slice(0, 10))
      })
      .finally(() => setLoading(false))
  }, [window])

  if (loading) return <div className="text-gray-400 text-sm">Finding analogues...</div>
  if (!analogues.length) return <div className="text-gray-400 text-sm">No analogues found.</div>

  return (
    <div>
      <p className="text-xs text-gray-400 mb-3">
        Days where the full correlation matrix most resembled <span className="font-mono text-gray-600">{today}</span>
      </p>
      <div className="space-y-1">
        {analogues.map((a, i) => {
          const { label, color } = getSimilarityLabel(a.similarity)
          return (
            <div key={a.date}
              className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                <span className="font-mono font-semibold text-gray-800">{a.date}</span>
                <span className={`text-xs ${color}`}>{label}</span>
              </div>
              <SimilarityBar value={a.similarity} />
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Red = structurally near-identical market regime. These dates are worth researching — what happened next?
      </p>
    </div>
  )
}