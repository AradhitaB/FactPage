'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Assignment } from '@/types'

interface UseAssignmentResult {
  assignment: Assignment | null
  isLoading: boolean
  error: Error | null
}

export function useAssignment(): UseAssignmentResult {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    api.getAssignment()
      .then(setAssignment)
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setIsLoading(false))
  }, []) // runs once on mount — backend returns existing session if cookie is present

  return { assignment, isLoading, error }
}
