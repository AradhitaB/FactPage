'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAssignment } from '@/lib/hooks/useAssignment'
import type { Stats, RawStats, FullStats, VariantCounts, TestResult } from '@/types'

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
  // Build a symmetric display range with padding around the CI
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
        {/* track */}
        <div className="absolute inset-y-[11px] left-0 right-0 rounded-full bg-surface-2" />
        {/* CI span */}
        <div
          className={`absolute inset-y-[11px] rounded-full ${containsZero ? 'bg-text-muted/20 border border-text-muted/30' : 'bg-success/25 border border-success/40'}`}
          style={{ left: `${lo}%`, right: `${100 - hi}%` }}
        />
        {/* zero line */}
        <div className="absolute inset-y-1 w-px bg-border" style={{ left: `${zero}%` }} />
        {/* point estimate */}
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

// ─── Experiment card ──────────────────────────────────────────────────────────

function ExperimentCard({
  name,
  a,
  b,
  test,
}: {
  name: string
  a: VariantCounts
  b: VariantCounts
  test: TestResult
}) {
  const diff = b.rate - a.rate
  const { significant } = test

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-sm font-semibold text-text">{name}</h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            significant ? 'bg-success/15 text-success' : 'bg-surface-2 text-text-muted'
          }`}
        >
          {significant ? 'Significant' : 'Not significant'}
        </span>
      </div>

      <ConversionBars a={a} b={b} />

      <div className="flex flex-col gap-1">
        <p className="text-xs text-text-muted">
          95% CI on B − A:{' '}
          <span className="font-mono">
            [{ci(test.ci_low)}, {ci(test.ci_high)}]
          </span>
          {' · '}point estimate{' '}
          <span className="font-mono">{ci(diff)}</span>
        </p>
        <CIDiagram ci_low={test.ci_low} ci_high={test.ci_high} diff={diff} />
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-4">
        {[
          { label: 'p-value', value: test.p_value.toFixed(4) },
          { label: 'z-stat', value: test.z_stat.toFixed(2) },
          { label: "Cohen's h", value: test.effect_size.toFixed(3) },
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

function ci(v: number): string {
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`
}

// ─── Views ────────────────────────────────────────────────────────────────────

function RawView({ stats }: { stats: RawStats }) {
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold text-text">Collecting participants</h2>
          <span className="font-mono text-xs text-text-muted">
            {stats.current_min_per_variant} / {stats.required_per_variant} per variant
          </span>
        </div>
        <ProgressBar value={stats.current_min_per_variant} max={stats.required_per_variant} />
        <p className="text-xs text-text-muted">
          Results unlock once every variant reaches {stats.required_per_variant} participants.
          Test: two-proportion z-test, α = 0.05, power = 0.80, MDE = 10 pp.
        </p>
      </section>

      {([
        { name: 'Experiment 1 — List format', a: stats.list_a, b: stats.list_b },
        { name: 'Experiment 2 — Button design', a: stats.button_a, b: stats.button_b },
      ] as const).map(({ name, a, b }) => (
        <section key={name} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text">{name}</h2>
          <ConversionBars a={a} b={b} />
          <div className="flex gap-6 text-xs text-text-muted">
            <span>A: {a.converted}/{a.assigned} ({(a.rate * 100).toFixed(1)}%)</span>
            <span>B: {b.converted}/{b.assigned} ({(b.rate * 100).toFixed(1)}%)</span>
          </div>
        </section>
      ))}
    </div>
  )
}

function FullView({ stats }: { stats: FullStats }) {
  return (
    <div className="flex flex-col gap-5">
      <ExperimentCard
        name="Experiment 1 — List format"
        a={stats.list_a}
        b={stats.list_b}
        test={stats.list_test}
      />
      <ExperimentCard
        name="Experiment 2 — Button design"
        a={stats.button_a}
        b={stats.button_b}
        test={stats.button_test}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const router = useRouter()
  const { assignment } = useAssignment()
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
  }, [router])

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-center text-sm text-red-400">
          Could not load results. Make sure the backend is running.
        </p>
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

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12">
      <div className="flex w-full max-w-2xl flex-col gap-6">

        <header className="flex flex-col gap-1">
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
            Here's the data so far.
          </p>
        </header>

        {stats.unlocked ? <FullView stats={stats} /> : <RawView stats={stats} />}

      </div>
    </main>
  )
}
