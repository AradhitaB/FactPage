'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAssignment } from '@/lib/hooks/useAssignment'
import { api } from '@/lib/api'
import { LIST_ITEMS } from '@/lib/facts'
import ScrollableList from '@/components/ScrollableList'
import ClickThroughList from '@/components/ClickThroughList'
import CTAButton from '@/components/CTAButton'

export default function Home() {
  const router = useRouter()
  const { assignment, isLoading, error } = useAssignment()

  // Tracks max depth reached — updated by onDepthChange without causing re-renders.
  // Read only at event-fire time (completion or button click).
  const shuffledItems = useMemo(
    () => [...LIST_ITEMS].sort(() => Math.random() - 0.5),
    []
  )

  const isDev = process.env.NODE_ENV === 'development'

  // Dev-only variant overrides — do not affect stored assignment or event recording
  const [devList, setDevList] = useState<'A' | 'B' | null>(null)
  const [devButton, setDevButton] = useState<'A' | 'B' | null>(null)
  useEffect(() => {
    if (assignment) {
      setDevList(assignment.list_variant as 'A' | 'B')
      setDevButton(assignment.button_variant as 'A' | 'B')
    }
  }, [assignment])

  const activeList = (isDev && devList) ? devList : assignment?.list_variant
  const activeButton = (isDev && devButton) ? devButton : assignment?.button_variant

  const listDepthRef = useRef(0)
  const listDepthFiredRef = useRef(false)

  const handleDepthChange = (depth: number) => {
    listDepthRef.current = Math.max(listDepthRef.current, depth)
  }

  // Fire list_complete + list_depth at completion — errors are swallowed so they never block the UI
  const handleListComplete = () => {
    if (!assignment) return
    api.recordEvent(assignment.session_id, 'list_complete').catch((err) => console.error('Failed to record event:', err))
    if (!listDepthFiredRef.current) {
      listDepthFiredRef.current = true
      api.recordEvent(assignment.session_id, 'list_depth', listDepthRef.current).catch((err) => console.error('Failed to record event:', err))
    }
  }

  // Fire list_depth (if not already) then button_click, then navigate — best-effort
  const handleButtonClick = () => {
    if (!assignment) return
    if (!listDepthFiredRef.current) {
      listDepthFiredRef.current = true
      api.recordEvent(assignment.session_id, 'list_depth', listDepthRef.current).catch((err) => console.error('Failed to record event:', err))
    }
    api.recordEvent(assignment.session_id, 'button_click').catch((err) => console.error('Failed to record event:', err))
    router.push('/stats')
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-text-muted text-sm animate-pulse">Loading…</span>
      </main>
    )
  }

  if (error || !assignment) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-center text-sm text-red-400">
          Could not reach the server. Make sure the backend is running.
        </p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-2xl flex-col gap-6">

        {/* Header */}
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            FactPage
          </h1>
          <p className="text-sm text-text-muted">
            Read through the list, then hit the button below.
          </p>
        </header>

        {/* List — variant determines presentation, not content */}
        {activeList === 'A' ? (
          <ScrollableList items={shuffledItems} onComplete={handleListComplete} onDepthChange={handleDepthChange} />
        ) : (
          <ClickThroughList items={shuffledItems} onComplete={handleListComplete} onDepthChange={handleDepthChange} />
        )}

        {/* CTA — variant determines visual treatment */}
        <CTAButton variant={activeButton ?? assignment.button_variant} onClick={handleButtonClick} />

        {/* Dev-only variant switcher */}
        {isDev && devList && devButton && (
          <div className="fixed bottom-4 right-4 flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-xs shadow-lg">
            <span className="font-mono text-text-muted">dev · variants</span>
            <div className="flex gap-2">
              <span className="text-text-muted">List</span>
              {(['A', 'B'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setDevList(v)}
                  className={`rounded px-2 py-0.5 font-mono transition-colors ${devList === v ? 'bg-accent text-bg font-semibold' : 'bg-surface-2 text-text-muted hover:text-text'}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <span className="text-text-muted">Button</span>
              {(['A', 'B'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setDevButton(v)}
                  className={`rounded px-2 py-0.5 font-mono transition-colors ${devButton === v ? 'bg-accent text-bg font-semibold' : 'bg-surface-2 text-text-muted hover:text-text'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
