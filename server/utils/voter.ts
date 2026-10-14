import type { H3Event } from 'h3'

const COOKIE = 'eb_voter'

/**
 * Anonymous visitor id (random UUID in a cookie) — one vote per track per visitor.
 * With `create`, a new visitor gets one.
 */
export function voterId(event: H3Event, create = false): string | null {
  const existing = getCookie(event, COOKIE)
  if (existing && /^[0-9a-f-]{36}$/.test(existing))
    return existing
  if (!create)
    return null
  const id = crypto.randomUUID()
  setCookie(event, COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: 60 * 60 * 24 * 365 * 2,
  })
  return id
}
