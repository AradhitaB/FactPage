// ─── A/B Assignment ───────────────────────────────────────────────────────────

export type Variant = 'A' | 'B'
export type EventType = 'list_complete' | 'button_click' | 'list_depth'

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
  effect_size: number  // Cohen's h — positive means B > A, negative means A > B
  power: number
  significant: boolean
}

export interface DepthBucket {
  facts: number  // 0–20
  count: number  // sessions that reached exactly this many facts
}

export interface DepthHistogram {
  overall: DepthBucket[]
  age_range: Record<string, DepthBucket[]>
  technical_background: Record<string, DepthBucket[]>
  prior_knowledge: Record<string, DepthBucket[]>
}

export interface DemographicGroup {
  label: string
  n: number
  completed: number
  rate: number
}

export interface DemographicsStats {
  total_responses: number
  age_range: DemographicGroup[]
  technical_background: DemographicGroup[]
  prior_knowledge: DemographicGroup[]
  device_type: DemographicGroup[]
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
  depth_histogram_a: DepthHistogram
  depth_histogram_b: DepthHistogram
  demographics?: DemographicsStats
  earliest_real_session_at?: string  // ISO timestamp of first non-synthetic session
}

// ─── Demographics ──────────────────────────────────────────────────────────────

export interface DemographicsSubmit {
  age_range: string | null
  technical_background: string | null
  prior_knowledge: string | null
  device_type: string | null
}

export interface DemographicsResponse {
  submitted: boolean
  age_range: string | null
  technical_background: string | null
  prior_knowledge: string | null
  device_type: string | null
}
