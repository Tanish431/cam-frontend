const BASE = "http://localhost:8080"

export async function fetchAssets() {
  const res = await fetch(`${BASE}/api/assets`)
  if (!res.ok) throw new Error("failed to fetch assets")
  return res.json()
}

export async function fetchCorrelationMatrix(window: number) {
  const res = await fetch(`${BASE}/api/correlations?window=${window}`)
  if (!res.ok) throw new Error("failed to fetch correlations")
  return res.json()
}

export async function fetchPairHistory(symbolA: string, symbolB: string, window: number) {
  const a = encodeURIComponent(symbolA)
  const b = encodeURIComponent(symbolB)
  const res = await fetch(`${BASE}/api/correlations/${a}/${b}?window=${window}`)
  if (!res.ok) throw new Error("failed to fetch pair history")
  return res.json()
}

export async function fetchRegimeEvents() {
  const res = await fetch(`${BASE}/api/regime-events`)
  if (!res.ok) throw new Error("failed to fetch regime events")
  return res.json()
}