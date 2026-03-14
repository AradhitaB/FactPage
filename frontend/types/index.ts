// ─── A/B Assignment ───────────────────────────────────────────────────────────

export type Variant = 'A' | 'B'
export type EventType = 'list_complete' | 'button_click' | 'list_depth'

export interface Assignment {
  session_id: string
  list_variant: Variant
  button_variant: Variant
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface VariantDepth {
  n: number        // sessions with a recorded depth value
  mean: number     // average depth among those sessions (0.0–1.0)
  coverage: number // n / total_assigned
}

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
  effect_size: number  // Cohen's h — positive means B > A, negative means A > B
  power: number
  significant: boolean
}

export interface Stats {
  required_per_variant: number
  list_a: VariantCounts
  list_b: VariantCounts
  button_a: VariantCounts
  button_b: VariantCounts
  list_current_min: number   // min(list_a.assigned, list_b.assigned)
  button_current_min: number // min(button_a.assigned, button_b.assigned)
  list_unlocked: boolean
  button_unlocked: boolean
  list_test?: TestResult     // present only when list_unlocked
  button_test?: TestResult   // present only when button_unlocked
  list_depth_a: VariantDepth
  list_depth_b: VariantDepth
}
