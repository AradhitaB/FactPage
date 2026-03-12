'use client'

import { useAssignment } from '@/lib/hooks/useAssignment'

export default function Home() {
  const { assignment, isLoading, error } = useAssignment()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-text-muted text-sm">Loading…</span>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-red-400 text-sm">
          Could not connect to server. Is the backend running?
        </span>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold tracking-tight">FactPage</h1>
      <p className="text-text-muted text-sm">
        Variant assignment: list&nbsp;
        <code className="font-mono text-accent">{assignment?.list_variant}</code>
        , button&nbsp;
        <code className="font-mono text-accent">{assignment?.button_variant}</code>
      </p>
      <p className="text-text-muted text-xs">
        Main page coming in the next commit.
      </p>
    </main>
  )
}
