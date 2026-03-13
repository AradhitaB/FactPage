/**
 * Tests for the stats page (frontend/app/stats/page.tsx).
 *
 * Components are not individually exported, so we test through StatsPage
 * with mocked dependencies (api.getStats, useAssignment, next/navigation).
 */

import { render, screen, act, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import StatsPage from '@/app/stats/page'
import { api } from '@/lib/api'
import { useAssignment } from '@/lib/hooks/useAssignment'
import type { Stats, TestResult, VariantCounts } from '@/types'

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/lib/api', () => ({ api: { getStats: jest.fn() } }))
jest.mock('@/lib/hooks/useAssignment', () => ({ useAssignment: jest.fn() }))
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: jest.fn() }) }))

const mockGetStats = api.getStats as jest.MockedFunction<typeof api.getStats>
const mockUseAssignment = useAssignment as jest.MockedFunction<typeof useAssignment>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeVariantCounts(assigned: number, converted: number): VariantCounts {
  return { assigned, converted, rate: assigned > 0 ? converted / assigned : 0 }
}

const TEST_RESULT_SIG: TestResult = {
  z_stat: 3.5,
  p_value: 0.0005,
  ci_low: 0.05,
  ci_high: 0.15,
  effect_size: 0.2,   // positive → B > A
  power: 0.92,
  significant: true,
}

const TEST_RESULT_INSIG: TestResult = {
  z_stat: 0.8,
  p_value: 0.42,
  ci_low: -0.03,
  ci_high: 0.07,
  effect_size: -0.05, // negative → A > B
  power: 0.18,
  significant: false,
}

const LOCKED_STATS: Stats = {
  required_per_variant: 388,
  list_a: makeVariantCounts(12, 5),
  list_b: makeVariantCounts(10, 4),
  button_a: makeVariantCounts(12, 7),
  button_b: makeVariantCounts(10, 3),
  list_current_min: 10,
  button_current_min: 10,
  list_unlocked: false,
  button_unlocked: false,
}

const UNLOCKED_STATS: Stats = {
  required_per_variant: 388,
  list_a: makeVariantCounts(400, 160),
  list_b: makeVariantCounts(395, 200),
  button_a: makeVariantCounts(400, 180),
  button_b: makeVariantCounts(395, 160),
  list_current_min: 395,
  button_current_min: 395,
  list_unlocked: true,
  button_unlocked: true,
  list_test: TEST_RESULT_SIG,
  button_test: TEST_RESULT_INSIG,
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers()
  mockUseAssignment.mockReturnValue({ assignment: null, isLoading: false, error: null })
})

afterEach(() => {
  jest.useRealTimers()
  jest.clearAllMocks()
})

// ─── Loading state ────────────────────────────────────────────────────────────

test('shows loading spinner before data arrives', () => {
  // getStats never resolves in this test
  mockGetStats.mockReturnValue(new Promise(() => {}))
  render(<StatsPage />)
  expect(screen.getByText(/loading results/i)).toBeInTheDocument()
})

// ─── Error state ──────────────────────────────────────────────────────────────

test('shows error message on non-403 fetch failure', async () => {
  mockGetStats.mockRejectedValue(new Error('Network error'))
  await act(async () => { render(<StatsPage />) })
  expect(screen.getByText(/could not load results/i)).toBeInTheDocument()
})

// ─── Locked (pre-threshold) ───────────────────────────────────────────────────

test('shows progress bars and raw counts when both experiments are locked', async () => {
  mockGetStats.mockResolvedValue(LOCKED_STATS)
  await act(async () => { render(<StatsPage />) })

  // Both experiment headings present
  expect(screen.getByText('Experiment 1 — List format')).toBeInTheDocument()
  expect(screen.getByText('Experiment 2 — Button design')).toBeInTheDocument()

  // Progress counts shown (10 / 388 per variant for both)
  const progressLabels = screen.getAllByText('10 / 388 per variant')
  expect(progressLabels).toHaveLength(2)

  // No significance badges — experiments not yet unlocked
  expect(screen.queryByText('Significant')).not.toBeInTheDocument()
  expect(screen.queryByText('Not significant')).not.toBeInTheDocument()
})

test('does not show multiple-comparisons note when both locked', async () => {
  mockGetStats.mockResolvedValue(LOCKED_STATS)
  await act(async () => { render(<StatsPage />) })
  expect(screen.queryByText(/family-wise/i)).not.toBeInTheDocument()
})

// ─── Unlocked (post-threshold) ────────────────────────────────────────────────

test('shows significance badges and test stats when unlocked', async () => {
  mockGetStats.mockResolvedValue(UNLOCKED_STATS)
  await act(async () => { render(<StatsPage />) })

  expect(screen.getByText('Significant')).toBeInTheDocument()
  expect(screen.getByText('Not significant')).toBeInTheDocument()

  // p-values rendered
  expect(screen.getByText('0.0005')).toBeInTheDocument()
  expect(screen.getByText('0.4200')).toBeInTheDocument()
})

test("shows Cohen's h direction labels", async () => {
  mockGetStats.mockResolvedValue(UNLOCKED_STATS)
  await act(async () => { render(<StatsPage />) })

  // list_test effect_size=0.2 → B > A; button_test effect_size=-0.05 → A > B
  expect(screen.getByText(/B > A/)).toBeInTheDocument()
  expect(screen.getByText(/A > B/)).toBeInTheDocument()
})

test('shows multiple-comparisons note when at least one experiment is unlocked', async () => {
  mockGetStats.mockResolvedValue(UNLOCKED_STATS)
  await act(async () => { render(<StatsPage />) })
  expect(screen.getByText(/family-wise/i)).toBeInTheDocument()
})

// ─── Variant assignment display ───────────────────────────────────────────────

test('shows variant assignment when available', async () => {
  mockGetStats.mockResolvedValue(LOCKED_STATS)
  mockUseAssignment.mockReturnValue({
    assignment: { session_id: 'abc', list_variant: 'A', button_variant: 'B' },
    isLoading: false,
    error: null,
  })
  await act(async () => { render(<StatsPage />) })

  // Query within the <header> banner to avoid matching ConversionBars 'A'/'B' labels
  const banner = screen.getByRole('banner')
  expect(within(banner).getByText('A')).toBeInTheDocument()
  expect(within(banner).getByText('B')).toBeInTheDocument()
})

// ─── Auto-refresh ─────────────────────────────────────────────────────────────

test('polls getStats every 30 seconds', async () => {
  mockGetStats.mockResolvedValue(LOCKED_STATS)
  await act(async () => { render(<StatsPage />) })

  // React 19 dev mode may double-invoke effects; reset and test relative increments.
  mockGetStats.mockClear()

  await act(async () => { jest.advanceTimersByTime(30_000) })
  expect(mockGetStats).toHaveBeenCalledTimes(1)

  await act(async () => { jest.advanceTimersByTime(30_000) })
  expect(mockGetStats).toHaveBeenCalledTimes(2)
})
