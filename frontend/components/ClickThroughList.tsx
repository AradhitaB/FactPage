'use client'

import { useState, useEffect, useRef } from 'react'
import type { ListItem } from '@/lib/facts'

interface ClickThroughListProps {
  items: ListItem[]
  onComplete: () => void
  onDepthChange?: (depth: number) => void
}

export default function ClickThroughList({ items, onComplete, onDepthChange }: ClickThroughListProps) {
  const [index, setIndex] = useState(0)
  const completedRef = useRef(false)
  const onDepthChangeRef = useRef(onDepthChange)
  useEffect(() => { onDepthChangeRef.current = onDepthChange }, [onDepthChange])

  const current = items[index]
  const isFirst = index === 0
  const isLast = index === items.length - 1
  const progress = ((index + 1) / items.length) * 100

  // Report depth as fraction of items seen whenever index changes
  useEffect(() => {
    onDepthChangeRef.current?.((index + 1) / items.length)
  }, [index, items.length])

  // Fire onComplete exactly once when the user navigates to the last item
  useEffect(() => {
    if (isLast && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  }, [isLast, onComplete])

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface overflow-hidden">

      {/* Progress bar */}
      <div className="h-[3px] w-full bg-surface-2">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${progress.toFixed(1)}%` }}
        />
      </div>

      {/* Item counter */}
      <div className="flex items-center justify-between px-6 pt-4 pb-0">
        <span className="font-mono text-xs text-text-muted">
          {index + 1} / {items.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col px-6 py-8">
        <span className="mb-2 font-mono text-xs text-accent">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h2 className="mb-3 text-base font-semibold text-text">{current.title}</h2>
        <p className="text-sm leading-relaxed text-text-muted">{current.body}</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border px-6 py-4">
        <button
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          disabled={isFirst}
          className="rounded-lg px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:pointer-events-none disabled:opacity-30"
        >
          ← Back
        </button>

        <button
          onClick={() => setIndex(i => Math.min(items.length - 1, i + 1))}
          disabled={isLast}
          className="rounded-lg px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent-dim disabled:pointer-events-none disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
