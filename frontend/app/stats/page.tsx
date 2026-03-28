'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAssignment } from '@/lib/hooks/useAssignment'
import type { Stats, VariantCounts, DepthBucket, DepthHistogram, TestResult, DemographicsResponse, DemographicsSubmit, DemographicGroup, DemographicsStats } from '@/types'

// ─── Primitives ───────────────────────────────────────────────────────────────

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-2">
      <div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function ConversionBars({ a, b }: { a: VariantCounts; b: VariantCounts }) {
  const maxRate = Math.max(a.rate, b.rate, 0.01)
  return (
    <div className="flex flex-col gap-2">
      {([['A', a], ['B', b]] as const).map(([label, counts]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-4 shrink-0 font-mono text-xs text-text-muted">{label}</span>
          <div className="relative h-5 flex-1 rounded bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded bg-accent/30 border border-accent/40"
              style={{ width: `${(counts.rate / maxRate) * 100}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right font-mono text-xs text-text-muted">
            {(counts.rate * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

function CIDiagram({ ci_low, ci_high, diff }: { ci_low: number; ci_high: number; diff: number }) {
  const maxAbs = Math.max(Math.abs(ci_low), Math.abs(ci_high), Math.abs(diff), 0.05)
  const halfRange = maxAbs * 1.6
  const toPercent = (v: number) => ((v + halfRange) / (halfRange * 2)) * 100

  const lo = Math.max(0, toPercent(ci_low))
  const hi = Math.min(100, toPercent(ci_high))
  const center = Math.min(100, Math.max(0, toPercent(diff)))
  const zero = toPercent(0)
  const containsZero = ci_low <= 0 && ci_high >= 0

  return (
    <div className="flex flex-col gap-1">
      <div className="relative h-8 w-full select-none">
        <div className="absolute inset-y-[11px] left-0 right-0 rounded-full bg-surface-2" />
        <div
          className={`absolute inset-y-[11px] rounded-full ${containsZero ? 'bg-text-muted/20 border border-text-muted/30' : 'bg-success/25 border border-success/40'}`}
          style={{ left: `${lo}%`, right: `${100 - hi}%` }}
        />
        <div className="absolute inset-y-1 w-px bg-border" style={{ left: `${zero}%` }} />
        <div
          className={`absolute top-1/2 -translate-y-1/2 h-4 w-1.5 rounded-full ${containsZero ? 'bg-text-muted' : 'bg-success'}`}
          style={{ left: `${center}%`, marginLeft: '-3px' }}
        />
      </div>
      <div className="flex justify-between font-mono text-[10px] text-text-muted">
        <span>{(-halfRange * 100).toFixed(0)}%</span>
        <span>0</span>
        <span>+{(halfRange * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}

// ─── Demo toggle ──────────────────────────────────────────────────────────────

function DemoToggle({ showDemo, onToggle }: { showDemo: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-px rounded-full border border-border p-0.5 text-[11px] font-medium">
      <button
        onClick={() => showDemo && onToggle()}
        className={`rounded-full px-2.5 py-0.5 transition-colors ${
          !showDemo ? 'bg-surface-2 text-text' : 'text-text-muted hover:text-text'
        }`}
      >
        Real
      </button>
      <button
        onClick={() => !showDemo && onToggle()}
        className={`rounded-full px-2.5 py-0.5 transition-colors ${
          showDemo ? 'bg-amber-400/15 text-amber-500' : 'text-text-muted hover:text-text'
        }`}
      >
        Sample
      </button>
    </div>
  )
}

// ─── Experiment sections ───────────────────────────────────────────────────────

function ExperimentRawSection({
  name, hypothesis, a, b, currentMin, required, demoA, demoB, demoTest,
}: {
  name: string; hypothesis: string; a: VariantCounts; b: VariantCounts; currentMin: number; required: number
  demoA: VariantCounts; demoB: VariantCounts; demoTest: TestResult
}) {
  const [showDemo, setShowDemo] = useState(false)
  const toggle = <DemoToggle showDemo={showDemo} onToggle={() => setShowDemo(d => !d)} />

  if (showDemo) {
    return <ExperimentFullSection name={name} hypothesis={hypothesis} a={demoA} b={demoB} test={demoTest} headerSlot={toggle} />
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text">{name}</h2>
          <p className="text-xs text-text-muted mt-0.5">{hypothesis}</p>
        </div>
        <div className="flex items-center gap-3">
          {toggle}
          <span className="font-mono text-xs text-text-muted">{currentMin} / {required} per variant</span>
        </div>
      </div>
      <ProgressBar value={currentMin} max={required} />
      <div className="opacity-50">
        <ConversionBars a={a} b={b} />
        <div className="flex gap-6 text-xs text-text-muted mt-2">
          <span>A: {a.converted}/{a.assigned} ({(a.rate * 100).toFixed(1)}%)</span>
          <span>B: {b.converted}/{b.assigned} ({(b.rate * 100).toFixed(1)}%)</span>
        </div>
      </div>
    </section>
  )
}

function ExperimentFullSection({
  name, hypothesis, a, b, test, headerSlot,
}: {
  name: string; hypothesis?: string; a: VariantCounts; b: VariantCounts; test: TestResult; headerSlot?: React.ReactNode
}) {
  const diff = b.rate - a.rate
  const { significant } = test
  const hDirection = test.effect_size > 0 ? 'B > A' : test.effect_size < 0 ? 'A > B' : 'no diff'

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text">{name}</h2>
          {hypothesis && <p className="text-xs text-text-muted mt-0.5">{hypothesis}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerSlot}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              significant ? 'bg-success/15 text-success' : 'bg-surface-2 text-text-muted'
            }`}
          >
            {significant ? 'Significant' : 'Not significant'}
          </span>
        </div>
      </div>

      <ConversionBars a={a} b={b} />

      <div className="flex flex-col gap-1">
        <p className="text-xs text-text-muted">
          95% CI on B − A:{' '}
          <span className="font-mono">
            [{fmtPct(test.ci_low)}, {fmtPct(test.ci_high)}]
          </span>
          {' · '}point estimate{' '}
          <span className="font-mono">{fmtPct(diff)}</span>
        </p>
        <CIDiagram ci_low={test.ci_low} ci_high={test.ci_high} diff={diff} />
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-4">
        {[
          { label: 'p-value', value: test.p_value.toFixed(4) },
          { label: 'z-stat', value: test.z_stat.toFixed(2) },
          { label: "Cohen's h", value: `${test.effect_size.toFixed(3)} (${hDirection})` },
          { label: 'Power', value: `${(test.power * 100).toFixed(0)}%` },
        ].map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs text-text-muted">{label}</dt>
            <dd className="font-mono text-sm text-text">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex gap-6 text-xs text-text-muted">
        <span>A: {a.converted}/{a.assigned}</span>
        <span>B: {b.converted}/{b.assigned}</span>
      </div>
    </section>
  )
}

function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`
}

// ─── Demo data ─────────────────────────────────────────────────────────────────

const mkBuckets = (counts: number[]): DepthBucket[] =>
  counts.map((count, facts) => ({ facts, count }))

const DEMO_STATS = {
  list: {
    a: { assigned: 312, converted: 126, rate: 126 / 312 } as VariantCounts,
    b: { assigned: 298, converted: 148, rate: 148 / 298 } as VariantCounts,
    test: {
      z_stat: 2.40, p_value: 0.016, ci_low: 0.017, ci_high: 0.170,
      effect_size: 0.187, power: 0.93, significant: true,
    } as TestResult,
  },
  button: {
    a: { assigned: 305, converted: 99, rate: 99 / 305 } as VariantCounts,
    b: { assigned: 311, converted: 103, rate: 103 / 311 } as VariantCounts,
    test: {
      z_stat: 0.18, p_value: 0.857, ci_low: -0.062, ci_high: 0.073,
      effect_size: 0.013, power: 0.05, significant: false,
    } as TestResult,
  },
  histogram: {
    overall: mkBuckets([3, 5, 7, 10, 13, 16, 20, 24, 28, 25, 30, 24, 19, 15, 12, 9, 7, 5, 4, 3, 31]),
    age_range: {
      '18_24':  mkBuckets([0, 1, 2, 3, 4, 5, 7, 9, 11, 10, 12, 10, 8, 6, 5, 4, 3, 2, 1, 1, 15]),
      '25_34':  mkBuckets([1, 2, 3, 4, 5, 6, 7, 9, 10, 9,  11, 8,  7, 5, 4, 3, 2, 2, 1, 1, 11]),
      '35_44':  mkBuckets([0, 1, 1, 2, 3, 4, 5, 5, 6,  5,  7,  5,  4, 3, 2, 2, 1, 1, 1, 0, 4]),
    },
    technical_background: {
      technical:          mkBuckets([0, 1, 2, 3, 4, 5, 7, 9,  11, 10, 13, 11, 9, 7, 6, 5, 4, 3, 2, 2, 20]),
      somewhat_technical: mkBuckets([1, 2, 3, 4, 5, 6, 7, 8,  9,  8,  10, 7,  6, 5, 4, 3, 2, 2, 1, 1, 8]),
      non_technical:      mkBuckets([1, 1, 2, 3, 4, 5, 6, 7,  8,  7,  7,  6,  4, 3, 2, 1, 1, 0, 1, 0, 3]),
    },
    prior_knowledge: {
      none:       mkBuckets([0, 1, 2, 3, 4, 5, 7, 9,  10, 9, 11, 9, 7, 5, 4, 3, 3, 2, 1, 1, 14]),
      a_few:      mkBuckets([1, 2, 3, 4, 5, 6, 7, 8,  9,  8, 10, 7, 6, 5, 4, 3, 2, 2, 1, 1, 10]),
      about_half: mkBuckets([1, 1, 1, 2, 3, 3, 5, 5,  7,  6, 8,  6, 5, 4, 3, 2, 2, 1, 1, 1, 7]),
    },
  } as DepthHistogram,
  demographics: {
    total_responses: 198,
    age_range: [
      { label: 'under_18', n: 12,  completed: 4,  rate: 0.333 },
      { label: '18_24',    n: 58,  completed: 27, rate: 0.466 },
      { label: '25_34',    n: 72,  completed: 35, rate: 0.486 },
      { label: '35_44',    n: 38,  completed: 17, rate: 0.447 },
      { label: '45_plus',  n: 18,  completed: 7,  rate: 0.389 },
    ] as DemographicGroup[],
    technical_background: [
      { label: 'non_technical',      n: 54,  completed: 21, rate: 0.389 },
      { label: 'somewhat_technical', n: 89,  completed: 40, rate: 0.449 },
      { label: 'technical',          n: 55,  completed: 28, rate: 0.509 },
    ] as DemographicGroup[],
    prior_knowledge: [
      { label: 'none',       n: 65, completed: 28, rate: 0.431 },
      { label: 'a_few',      n: 78, completed: 34, rate: 0.436 },
      { label: 'about_half', n: 32, completed: 14, rate: 0.438 },
      { label: 'most',       n: 15, completed: 7,  rate: 0.467 },
      { label: 'all',        n: 8,  completed: 3,  rate: 0.375 },
    ] as DemographicGroup[],
    device_type: [
      { label: 'desktop', n: 142, completed: 65, rate: 0.458 },
      { label: 'mobile',  n: 56,  completed: 22, rate: 0.393 },
    ] as DemographicGroup[],
  } as DemographicsStats,
}

// ─── Depth histogram ──────────────────────────────────────────────────────────

const TOTAL_FACTS = 20

type SurveyData = {
  ageRange: string | null
  techBg: string | null
  priorKnowledge: string | null
}

function HistogramSection({
  histogram,
  demoHistogram,
  userFacts,
  surveyData,
}: {
  histogram: DepthHistogram
  demoHistogram: DepthHistogram
  userFacts: number | null
  surveyData: SurveyData | null
}) {
  type Tab = 'overall' | 'age_range' | 'technical_background' | 'prior_knowledge'
  const [tab, setTab] = useState<Tab>('overall')
  const [showDemo, setShowDemo] = useState(false)
  const activeHistogram = showDemo ? demoHistogram : histogram
  const hasSurvey = surveyData !== null

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overall', label: 'All users' },
    { key: 'age_range', label: 'My age group' },
    { key: 'technical_background', label: 'My background' },
    { key: 'prior_knowledge', label: 'My knowledge' },
  ]

  const buckets = useMemo((): DepthBucket[] => {
    if (tab === 'overall') return activeHistogram.overall
    const userKey =
      tab === 'age_range' ? surveyData?.ageRange
      : tab === 'technical_background' ? surveyData?.techBg
      : surveyData?.priorKnowledge
    if (!userKey) return activeHistogram.overall
    const groups =
      tab === 'age_range' ? activeHistogram.age_range
      : tab === 'technical_background' ? activeHistogram.technical_background
      : activeHistogram.prior_knowledge
    return groups[userKey] ?? activeHistogram.overall
  }, [tab, activeHistogram, surveyData])

  const maxCount = Math.max(...buckets.map(b => b.count), 1)
  const totalInView = buckets.reduce((s, b) => s + b.count, 0)

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text">How far did people get?</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Facts read · your format variant
            {totalInView > 0 && <span className="font-mono"> · {totalInView} sessions</span>}
          </p>
        </div>
        <DemoToggle showDemo={showDemo} onToggle={() => setShowDemo(d => !d)} />
      </div>

      {/* Tab toggles */}
      <div className="flex flex-wrap gap-1.5">
        {tabs.map(({ key, label }) => {
          const disabled = key !== 'overall' && !hasSurvey
          return (
            <button
              key={key}
              onClick={() => !disabled && setTab(key)}
              disabled={disabled}
              className={`rounded px-2.5 py-1 text-xs transition-colors ${
                tab === key
                  ? 'bg-accent/15 text-accent font-medium'
                  : disabled
                  ? 'text-text-muted/25 cursor-default'
                  : 'bg-surface-2 text-text-muted hover:text-text'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {!hasSurvey && (
        <p className="text-[11px] text-text-muted/60 italic">
          Answer the survey to filter by your age group, background, and prior knowledge.
        </p>
      )}

      {totalInView === 0 ? (
        <p className="text-xs text-text-muted">No depth data yet.</p>
      ) : (
        <div className="relative pt-6">
          <div className="flex items-end gap-px" style={{ height: '72px' }}>
            {buckets.map(b => {
              const isUser = userFacts !== null && b.facts === userFacts
              const heightPct = b.count > 0 ? Math.max((b.count / maxCount) * 100, 3) : 0
              return (
                <div key={b.facts} className="relative flex flex-1 flex-col items-center justify-end h-full">
                  {isUser && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[9px] font-bold text-accent leading-none pb-1 whitespace-nowrap">
                      you
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t-[2px] ${isUser ? 'bg-accent' : 'bg-accent/20'}`}
                    style={{ height: heightPct > 0 ? `${heightPct}%` : '0' }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between font-mono text-[10px] text-text-muted mt-1.5">
            <span>0</span>
            <span>10 facts</span>
            <span>20</span>
          </div>
        </div>
      )}

      {userFacts !== null && (
        <p className="text-xs text-text-muted">
          You reached fact <span className="font-mono text-text">{userFacts}</span> of {TOTAL_FACTS}.
        </p>
      )}
    </section>
  )
}

// ─── Limitations ──────────────────────────────────────────────────────────────

function LimitationsSection({ eitherUnlocked }: { eitherUnlocked: boolean }) {
  const [open, setOpen] = useState(false)

  const items = [
    {
      label: 'Scroll depth ≠ reading',
      detail: 'Completion is measured by scroll position reaching 80% of the container. We cannot verify whether text was actually read — a fast scroll counts the same as careful reading.',
    },
    {
      label: 'Self-selected sample',
      detail: 'Participants are people who found this page — not a random population sample. Results describe this audience, not people in general.',
    },
    {
      label: 'Novelty effects',
      detail: 'Early visitors (friends, direct links) may differ from later organic traffic. Behaviour may also change once a format feels familiar rather than new.',
    },
    {
      label: 'Multiple comparisons',
      detail: 'Running two tests simultaneously raises the family-wise false-positive rate. Bonferroni correction (α = 0.025 per test) controls this to ~5%, at the cost of slightly reduced power — real effects are marginally harder to detect.',
    },
    {
      label: 'Peeking problem',
      detail: 'The power analysis assumes results are read exactly once — at the pre-registered sample size. Checking significance before the threshold and stopping early inflates the false-positive rate beyond 5%.',
    },
    {
      label: 'Demographics survey bias',
      detail: 'The survey is optional and only shown to users who reached ≥25% depth. Non-responders and early drop-offs are excluded, so demographic breakdowns describe engaged users, not all visitors.',
    },
  ]

  return (
    <section className="rounded-lg border border-border bg-surface">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-text">Methodology & known limitations</span>
        <span className="font-mono text-xs text-text-muted/60">{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-5 pb-5 pt-4">
          {eitherUnlocked && (
            <p className="text-xs text-text-muted">
              Results are exploratory signals — treat significance as a prompt for further investigation, not a verdict.
            </p>
          )}
          <ul className="flex flex-col gap-3">
            {items.map(({ label, detail }) => (
              <li key={label} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-text">{label}</span>
                <span className="text-xs text-text-muted leading-relaxed">{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

// ─── Demographics stats ────────────────────────────────────────────────────────

const AGE_LABELS: Record<string, string> = { under_18: 'Under 18', '18_24': '18–24', '25_34': '25–34', '35_44': '35–44', '45_plus': '45+' }
const TECH_LABELS: Record<string, string> = { non_technical: 'Non-technical', somewhat_technical: 'Somewhat', technical: 'Technical' }
const PRIOR_LABELS: Record<string, string> = { none: 'None', a_few: 'A few', about_half: '~Half', most: 'Most', all: 'All' }
const DEVICE_LABELS: Record<string, string> = { desktop: 'Desktop', mobile: 'Mobile' }

function DemoBars({ groups }: { groups: DemographicGroup[] }) {
  const maxRate = Math.max(...groups.map(g => g.rate), 0.01)
  return (
    <div className="flex flex-col gap-1.5">
      {groups.map(g => (
        <div key={g.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-right font-mono text-[11px] text-text-muted">{g.label}</span>
          <div className="relative h-4 flex-1 rounded bg-surface-2 overflow-hidden">
            <div className="h-full rounded bg-accent/30 border border-accent/40" style={{ width: `${(g.rate / maxRate) * 100}%` }} />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-[11px] text-text-muted">{(g.rate * 100).toFixed(0)}%</span>
          <span className="w-10 shrink-0 font-mono text-[11px] text-text-muted/50">n={g.n}</span>
        </div>
      ))}
    </div>
  )
}

function DemographicsStatsSection({ data, demoData }: { data: DemographicsStats | null; demoData: DemographicsStats }) {
  const [showDemo, setShowDemo] = useState(false)
  const active = showDemo ? demoData : data

  const sections: { title: string; groups: DemographicGroup[]; labels: Record<string, string> }[] = active ? [
    { title: 'Completion by age range', groups: active.age_range, labels: AGE_LABELS },
    { title: 'Completion by technical background', groups: active.technical_background, labels: TECH_LABELS },
    { title: 'Completion by prior knowledge', groups: active.prior_knowledge, labels: PRIOR_LABELS },
    { title: 'Completion by device', groups: active.device_type, labels: DEVICE_LABELS },
  ] : []

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text">Demographics — completion rates</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {active
              ? <>{active.total_responses} survey responses · descriptive only, not part of the hypothesis tests</>
              : <>No survey responses yet.</>
            }
          </p>
        </div>
        <DemoToggle showDemo={showDemo} onToggle={() => setShowDemo(d => !d)} />
      </div>

      {sections.length === 0 ? (
        <p className="text-xs text-text-muted/50">Switch to Sample to preview what this section will look like.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {sections.map(({ title, groups, labels }) => {
            const labelled = groups.map(g => ({ ...g, label: labels[g.label] ?? g.label }))
            return (
              <div key={title} className="flex flex-col gap-2">
                <p className="text-xs font-medium text-text-muted">{title}</p>
                {labelled.length > 0 ? <DemoBars groups={labelled} /> : <p className="text-xs text-text-muted/50">No data</p>}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ─── Demographics survey card ──────────────────────────────────────────────────

function ThankYouState({ onExpire }: { onExpire: () => void }) {
  useEffect(() => {
    const id = setTimeout(onExpire, 10_000)
    return () => clearTimeout(id)
  }, [onExpire])

  return (
    <section className="rounded-lg border border-border bg-surface px-5 py-4">
      <p className="text-sm font-medium text-text">Thanks — that helps a lot.</p>
    </section>
  )
}

function DemographicsCard({
  onDone,
  onSubmit,
}: {
  onDone: () => void
  onSubmit: (data: SurveyData) => void
}) {
  const [show, setShow] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ageRange, setAgeRange] = useState<string | null>(null)
  const [techBg, setTechBg] = useState<string | null>(null)
  const [priorKnowledge, setPriorKnowledge] = useState<string | null>(null)

  useEffect(() => {
    // Always call the API — cookies may have been cleared (new session),
    // making any localStorage dismissed flag stale. API response is authoritative.
    api.getDemographics()
      .then((res: DemographicsResponse) => {
        if (res.submitted) {
          onSubmit({ ageRange: res.age_range, techBg: res.technical_background, priorKnowledge: res.prior_knowledge })
          onDone()
        } else {
          setShow(true)
        }
      })
      .catch(() => {
        onDone() // if API unavailable, don't block results
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function dismiss() {
    setShow(false)
    onDone()
  }

  async function handleSubmit() {
    const device = typeof window !== 'undefined'
      ? (window.innerWidth < 768 ? 'mobile' : 'desktop')
      : null
    setBusy(true)
    try {
      await api.submitDemographics({
        age_range: ageRange,
        technical_background: techBg,
        prior_knowledge: priorKnowledge,
        device_type: device,
      } satisfies DemographicsSubmit)
      onSubmit({ ageRange, techBg, priorKnowledge })
      setSubmitted(true)
      onDone() // show results immediately — don't make them wait
    } catch {
      // best-effort — swallow errors
    } finally {
      setBusy(false)
    }
  }

  if (!show) return null

  if (submitted) {
    return <ThankYouState onExpire={() => setShow(false)} />
  }

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text">Quick survey</h2>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-muted">optional</span>
        </div>
        <p className="text-xs text-text-muted mt-0.5">Takes 20 seconds. Helps contextualise the results — you can skip if you prefer.</p>
      </div>

      {/* Age range */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-text-muted">Age range</legend>
        <div className="flex flex-wrap gap-2">
          {(['under_18', '18_24', '25_34', '35_44', '45_plus'] as const).map((v) => {
            const labels: Record<string, string> = { under_18: 'Under 18', '18_24': '18–24', '25_34': '25–34', '35_44': '35–44', '45_plus': '45+' }
            return (
              <button
                key={v}
                onClick={() => setAgeRange(ageRange === v ? null : v)}
                className={`rounded px-3 py-1 text-xs transition-colors ${ageRange === v ? 'bg-accent text-bg font-medium' : 'bg-surface-2 text-text-muted hover:text-text'}`}
              >
                {labels[v]}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Technical background */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-text-muted">Technical background</legend>
        <div className="flex flex-wrap gap-2">
          {(['non_technical', 'somewhat_technical', 'technical'] as const).map((v) => {
            const labels: Record<string, string> = { non_technical: 'Non-technical', somewhat_technical: 'Somewhat technical', technical: 'Technical' }
            return (
              <button
                key={v}
                onClick={() => setTechBg(techBg === v ? null : v)}
                className={`rounded px-3 py-1 text-xs transition-colors ${techBg === v ? 'bg-accent text-bg font-medium' : 'bg-surface-2 text-text-muted hover:text-text'}`}
              >
                {labels[v]}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Prior knowledge */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-text-muted">How many of these facts did you already know?</legend>
        <div className="flex flex-wrap gap-2">
          {(['none', 'a_few', 'about_half', 'most', 'all'] as const).map((v) => {
            const labels: Record<string, string> = { none: 'None', a_few: 'A few', about_half: 'About half', most: 'Most', all: 'All' }
            return (
              <button
                key={v}
                onClick={() => setPriorKnowledge(priorKnowledge === v ? null : v)}
                className={`rounded px-3 py-1 text-xs transition-colors ${priorKnowledge === v ? 'bg-accent text-bg font-medium' : 'bg-surface-2 text-text-muted hover:text-text'}`}
              >
                {labels[v]}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="rounded-lg px-4 py-2 text-sm font-medium text-accent ring-1 ring-accent/40 transition-colors hover:bg-accent/10 disabled:opacity-40"
        >
          {busy ? 'Submitting…' : 'Submit'}
        </button>
        <button
          onClick={dismiss}
          disabled={busy}
          className="rounded-lg px-4 py-2 text-sm font-medium text-text-muted ring-1 ring-border transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-40"
        >
          Skip
        </button>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000
const isDev = process.env.NEXT_PUBLIC_DEV_TOOLS === 'true'

export default function StatsPage() {
  const router = useRouter()
  const { assignment } = useAssignment()
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [surveyDone, setSurveyDone] = useState(false)
  const [surveyKey, setSurveyKey] = useState(0)
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [userFacts, setUserFacts] = useState<number | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('factpage_depth')
    if (raw !== null) {
      const depth = parseFloat(raw)
      if (!isNaN(depth)) setUserFacts(Math.round(depth * TOTAL_FACTS))
    }
  }, [])

  function fetchStats() {
    api.getStats()
      .then(setStats)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('403')) {
          router.replace('/')
        } else {
          setError(msg)
        }
      })
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <p className="text-sm text-text-muted">
            Results couldn&apos;t load — this usually happens when you navigate away and come back after a while, since the session expires.
            A part of the A/B test records the 'depth' of 'scroll' into the list. You refresh to try again.
          </p>
          <button
            onClick={() => { setError(null); fetchStats() }}
            className="rounded-lg px-4 py-2 text-sm font-medium text-accent ring-1 ring-accent/40 transition-colors hover:bg-accent/10"
          >
            Refresh
          </button>
        </div>
      </main>
    )
  }

  if (!stats) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="animate-pulse text-sm text-text-muted">Loading results…</span>
      </main>
    )
  }

  const eitherUnlocked = stats.list_unlocked || stats.button_unlocked
  const histogram = assignment?.list_variant === 'B' ? stats.depth_histogram_b : stats.depth_histogram_a

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12">
      <div className="flex w-full max-w-2xl flex-col gap-6">

        <header className="flex flex-col gap-1">
          <button
            onClick={() => router.push('/')}
            className="mb-2 self-start font-mono text-xs text-text-muted/60 transition-colors hover:text-text-muted"
          >
            ← back to list
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Live Results</h1>
          <p className="text-sm text-text-muted">
            You were in{' '}
            {assignment ? (
              <>
                list variant{' '}
                <span className="font-mono text-accent">{assignment.list_variant}</span>
                {' and button variant '}
                <span className="font-mono text-accent">{assignment.button_variant}</span>.{' '}
              </>
            ) : (
              'this experiment. '
            )}
            Here&apos;s the data so far.
          </p>
          {stats.earliest_real_session_at && (
            <p className="text-xs text-text-muted/60">
              Real data collected since{' '}
              {new Date(stats.earliest_real_session_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </header>

        <DemographicsCard
          key={surveyKey}
          onDone={() => setSurveyDone(true)}
          onSubmit={setSurveyData}
        />

        {surveyDone && (
          <>
            {stats.list_unlocked && stats.list_test ? (
              <ExperimentFullSection
                name="Experiment 1 — List format"
                hypothesis="Does explicit Next/Back navigation (B) drive higher engagement than snap-scrolling (A)?"
                a={stats.list_a}
                b={stats.list_b}
                test={stats.list_test}
              />
            ) : (
              <ExperimentRawSection
                name="Experiment 1 — List format"
                hypothesis="Does explicit Next/Back navigation (B) drive higher engagement than snap-scrolling (A)?"
                a={stats.list_a}
                b={stats.list_b}
                currentMin={stats.list_current_min}
                required={stats.required_per_variant}
                demoA={DEMO_STATS.list.a}
                demoB={DEMO_STATS.list.b}
                demoTest={DEMO_STATS.list.test}
              />
            )}

            {stats.button_unlocked && stats.button_test ? (
              <ExperimentFullSection
                name="Experiment 2 — Button design"
                hypothesis="Does a filled button (A) convert more users to view results than an outlined button (B)?"
                a={stats.button_a}
                b={stats.button_b}
                test={stats.button_test}
              />
            ) : (
              <ExperimentRawSection
                name="Experiment 2 — Button design"
                hypothesis="Does a filled button (A) convert more users to view results than an outlined button (B)?"
                a={stats.button_a}
                b={stats.button_b}
                currentMin={stats.button_current_min}
                required={stats.required_per_variant}
                demoA={DEMO_STATS.button.a}
                demoB={DEMO_STATS.button.b}
                demoTest={DEMO_STATS.button.test}
              />
            )}

            <HistogramSection
              histogram={histogram}
              demoHistogram={DEMO_STATS.histogram}
              userFacts={userFacts}
              surveyData={surveyData}
            />

            <DemographicsStatsSection
              data={stats.demographics ?? null}
              demoData={DEMO_STATS.demographics}
            />

            <LimitationsSection eitherUnlocked={eitherUnlocked} />
          </>
        )}

        {/* Dev-only controls */}
        {isDev && (
          <div className="flex justify-end">
            <button
              onClick={async () => {
                await api.devResetSurvey().catch(() => {})
                setSurveyDone(false)
                setSurveyData(null)
                setSurveyKey(k => k + 1)
              }}
              className="rounded px-3 py-1 text-xs font-medium text-text-muted ring-1 ring-border transition-colors hover:bg-surface-2 hover:text-text"
            >
              Reset survey
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
