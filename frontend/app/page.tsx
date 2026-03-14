'use client'

import { useRef, useMemo } from 'react'
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
        {assignment.list_variant === 'A' ? (
          <ScrollableList items={shuffledItems} onComplete={handleListComplete} onDepthChange={handleDepthChange} />
        ) : (
          <ClickThroughList items={shuffledItems} onComplete={handleListComplete} onDepthChange={handleDepthChange} />
        )}

        {/* CTA — variant determines visual treatment */}
        <CTAButton variant={assignment.button_variant} onClick={handleButtonClick} />

      </div>
    </main>
  )
}
