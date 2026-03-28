import type { Assignment, EventType, Stats, DemographicsSubmit, DemographicsResponse } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('factpage_session_id') : null
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      credentials: 'include', // required — backend sets session cookie cross-origin
      headers: {
        'Content-Type': 'application/json',
        ...(sessionId ? { 'X-Session-Id': sessionId } : {}),
      },
      signal: controller.signal,
      ...init,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  getAssignment: (): Promise<Assignment> =>
    apiFetch('/api/assignment'),

  recordEvent: (sessionId: string, eventType: EventType, value?: number): Promise<{ ok: boolean }> =>
    apiFetch('/api/events', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, event_type: eventType, value: value ?? null }),
    }),

  getStats: (): Promise<Stats> =>
    apiFetch('/api/stats'),

  getDemographics: (): Promise<DemographicsResponse> =>
    apiFetch('/api/demographics'),

  submitDemographics: (body: DemographicsSubmit): Promise<DemographicsResponse> =>
    apiFetch('/api/demographics', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  devResetSurvey: (): Promise<{ ok: boolean }> =>
    apiFetch('/api/dev/reset-survey', { method: 'POST' }),
}
