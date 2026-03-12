// ─── A/B Assignment ───────────────────────────────────────────────────────────

export type Variant = 'A' | 'B'
export type EventType = 'list_complete' | 'button_click'

export interface Assignment {
  session_id: string
  list_variant: Variant
  button_variant: Variant
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface VariantCounts {
  assigned: number
  converted: number
  rate: number
}

export interface TestResult {
  z_stat: number
  p_value: number
  ci_low: number
  ci_high: number
  effect_size: number  // Cohen's h
  power: number
  significant: boolean
}

export interface RawStats {
  unlocked: false
  list_a: VariantCounts
  list_b: VariantCounts
  button_a: VariantCounts
  button_b: VariantCounts
  required_per_variant: number
  current_min_per_variant: number
}

export interface FullStats {
  unlocked: true
  list_a: VariantCounts
  list_b: VariantCounts
  button_a: VariantCounts
  button_b: VariantCounts
  required_per_variant: number
  list_test: TestResult
  button_test: TestResult
}

export type Stats = RawStats | FullStats
