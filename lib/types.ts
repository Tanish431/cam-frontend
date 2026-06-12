export interface Asset {
  id: number
  symbol: string
  name: string
  asset_class: string
}

export interface CorrelationEntry {
  symbol_a: string
  symbol_b: string
  window_days: number
  correlation: number
  zscore: number
}

export interface PairHistory {
  time: string
  correlation: number
  zscore: number
}

export interface RegimeEvent {
  time: string
  symbol_a: string
  symbol_b: string
  window_days: number
  correlation: number
  zscore: number
}