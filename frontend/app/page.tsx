'use client'

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

  // Fire list_complete event — errors are swallowed so they never block the UI
  const handleListComplete = () => {
    if (!assignment) return
    api.recordEvent(assignment.session_id, 'list_complete').catch((err) => console.error('Failed to record event:', err))
  }

  // Fire button_click then navigate immediately — recording is best-effort
  const handleButtonClick = () => {
    if (!assignment) return
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
          <ScrollableList items={LIST_ITEMS} onComplete={handleListComplete} />
        ) : (
          <ClickThroughList items={LIST_ITEMS} onComplete={handleListComplete} />
        )}

        {/* CTA — variant determines visual treatment */}
        <CTAButton variant={assignment.button_variant} onClick={handleButtonClick} />

      </div>
    </main>
  )
}
