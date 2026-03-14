'use client'

import { useRef } from 'react'
import { useScrollDepth } from '@/lib/hooks/useScrollDepth'
import type { ListItem } from '@/lib/facts'

interface ScrollableListProps {
  items: ListItem[]
  onComplete: () => void
  onDepthChange?: (depth: number) => void
}

export default function ScrollableList({ items, onComplete, onDepthChange }: ScrollableListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { depth } = useScrollDepth(containerRef, 0.8, onComplete, onDepthChange)

  return (
    <div className="relative flex flex-col rounded-xl border border-border bg-surface overflow-hidden">

      {/* Scrollable content */}
      <div
        ref={containerRef}
        className="h-[360px] overflow-y-auto sm:h-[480px]"
      >
        <div className="flex flex-col divide-y divide-border">
          {items.map((item, i) => (
            <div key={item.id} className="px-6 py-5">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-xs text-text-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="text-sm font-semibold text-text">{item.title}</h2>
              </div>
              <p className="text-sm leading-relaxed text-text-muted">{item.body}</p>
            </div>
          ))}

          {/* Bottom padding so last item clears the progress bar */}
          <div className="h-4" />
        </div>
      </div>

      {/* Scroll progress bar — pinned to bottom of the card */}
      <div className="h-[3px] w-full bg-surface-2">
        <div
          className="h-full bg-accent transition-all duration-150"
          style={{ width: `${Math.min(depth * 100, 100).toFixed(1)}%` }}
        />
      </div>
    </div>
  )
}
