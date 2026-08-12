type FetchError = {
  data?: { error?: string }
  statusCode?: number
  status?: number
}

export function getApiErrorMessage(e: unknown): string | undefined {
  const err = e as FetchError
  return err.data?.error?.trim() || undefined
}

export function getApiErrorStatus(e: unknown): number | undefined {
  const err = e as FetchError
  return err.statusCode ?? err.status
}

/** Map known backend error strings to an i18n key, or return fallbackKey. */
export function mapApiError(
  e: unknown,
  rules: Array<{ match: string | RegExp; key: string }>,
  fallbackKey: string,
): string {
  const msg = getApiErrorMessage(e)?.toLowerCase() ?? ''
  for (const rule of rules) {
    const matched = typeof rule.match === 'string'
      ? msg.includes(rule.match.toLowerCase())
      : rule.match.test(msg)
    if (matched) return rule.key
  }
  return fallbackKey
}
