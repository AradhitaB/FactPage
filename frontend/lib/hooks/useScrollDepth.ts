'use client'

import { useEffect, useRef, useState } from 'react'

interface UseScrollDepthResult {
  depth: number    // 0–1, current scroll progress
  completed: boolean
}

export function useScrollDepth(
  containerRef: React.RefObject<HTMLElement | null>,
  threshold = 0.8,
  onComplete?: () => void,
  onDepthChange?: (depth: number) => void,
): UseScrollDepthResult {
  const [depth, setDepth] = useState(0)
  const [completed, setCompleted] = useState(false)

  // Refs prevent stale closures inside the scroll listener
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const onDepthChangeRef = useRef(onDepthChange)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])
  useEffect(() => { onDepthChangeRef.current = onDepthChange }, [onDepthChange])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function handleScroll() {
      if (completedRef.current) return

      const scrollable = el!.scrollHeight - el!.clientHeight
      if (scrollable <= 0) return

      const current = el!.scrollTop / scrollable
      setDepth(current)
      onDepthChangeRef.current?.(current)

      if (current >= threshold) {
        completedRef.current = true
        setCompleted(true)
        onCompleteRef.current?.()
      }
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [containerRef, threshold])

  return { depth, completed }
}
