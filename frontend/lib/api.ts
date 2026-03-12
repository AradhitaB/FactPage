import type { Assignment, EventType, Stats } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include', // required — backend sets session cookie cross-origin
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  getAssignment: (): Promise<Assignment> =>
    apiFetch('/api/assignment'),

  recordEvent: (sessionId: string, eventType: EventType): Promise<{ ok: boolean }> =>
    apiFetch('/api/events', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, event_type: eventType }),
    }),

  getStats: (): Promise<Stats> =>
    apiFetch('/api/stats'),
}
