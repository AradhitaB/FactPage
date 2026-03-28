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

  const progress = Math.min(depth * 100, 100)

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface overflow-hidden">

      {/* Progress bar */}
      <div className="h-[3px] w-full bg-surface-2 shrink-0">
        <div
          className="h-full bg-accent transition-all duration-150"
          style={{ width: `${progress.toFixed(1)}%` }}
        />
      </div>

      {/* Scroll area with bottom fade */}
      <div className="relative">
        <div
          ref={containerRef}
          className="h-[320px] overflow-y-auto sm:h-[400px]"
        >
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <div
                key={item.id}
                className={`px-6 py-5${!isLast ? ' border-b border-border' : ''}`}
              >
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-mono text-xs text-accent shrink-0">
                    {String(i + 1).padStart(2, '0')} / {items.length}
                  </span>
                  <h2 className="text-base font-semibold text-text">{item.title}</h2>
                </div>
                <p className="text-sm leading-relaxed text-text-muted">{item.body}</p>
              </div>
            )
          })}
        </div>

        {/* Fade signals more content below; disappears when complete */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-surface to-transparent transition-opacity duration-300"
          style={{ opacity: progress >= 99 ? 0 : 1 }}
        />
      </div>
    </div>
  )
}
