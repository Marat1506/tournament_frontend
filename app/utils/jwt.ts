const REFRESH_SKEW_MS = 30_000

export function jwtExpiresAt(token: string): number | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
    const payload = JSON.parse(atob(b64 + pad)) as { exp?: number }
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  }
  catch {
    return null
  }
}

export function isAccessTokenFresh(token: string, skewMs = REFRESH_SKEW_MS): boolean {
  if (!token) return false
  const exp = jwtExpiresAt(token)
  if (exp == null) return false
  return exp - Date.now() > skewMs
}

export function httpStatus(error: unknown): number | undefined {
  const err = error as { statusCode?: number; status?: number }
  return err.statusCode ?? err.status
}
