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

      {/* Progress bar — top, matching ClickThroughList */}
      <div className="h-[3px] w-full bg-surface-2">
        <div
          className="h-full bg-accent transition-all duration-150"
          style={{ width: `${progress.toFixed(1)}%` }}
        />
      </div>

      {/* Scrollable content — snap one item at a time */}
      <div
        ref={containerRef}
        className="h-[280px] overflow-y-scroll snap-y snap-mandatory sm:h-[320px]"
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          const isFirst = i === 0
          return (
            <div
              key={item.id}
              className="relative shrink-0 snap-start snap-always flex flex-col h-[280px] sm:h-[320px]"
            >
              {/* Up scroll hint — top */}
              {!isFirst && (
                <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none">
                  <span className="font-mono text-[10px] text-text-muted/40">↑ scroll</span>
                </div>
              )}

              {/* Counter */}
              <div className="flex items-center px-6 pt-5 pb-0">
                <span className="font-mono text-xs text-accent">
                  {String(i + 1).padStart(2, '0')} / {items.length}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col px-6 py-4">
                <h2 className="mb-3 text-base font-semibold text-text">{item.title}</h2>
                <p className="text-sm leading-relaxed text-text-muted">{item.body}</p>
              </div>

              {/* Down scroll hint — bottom footer */}
              <div className="mt-auto border-t border-border px-6 py-4 flex justify-center pointer-events-none">
                {!isLast ? (
                  <span className="animate-bounce font-mono text-[10px] text-text-muted/60">↓ scroll</span>
                ) : (
                  <span className="font-mono text-[10px] text-text-muted/30">end of list</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
