import ru from '../../i18n/locales/ru.json'
import en from '../../i18n/locales/en.json'
import es from '../../i18n/locales/es.json'

export type AppLocale = 'ru' | 'en' | 'es'

export const LOCALES: AppLocale[] = ['ru', 'en', 'es']

export const messages: Record<AppLocale, Record<string, unknown>> = {
  ru,
  en,
  es,
}

function lookup(obj: Record<string, unknown>, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
  return typeof value === 'string' ? value : undefined
}

export function translate(
  locale: AppLocale,
  key: string,
  params?: Record<string, string | number>,
): string {
  let text = lookup(messages[locale], key)
    ?? lookup(messages.ru, key)
    ?? key

  if (params) {
    for (const [name, value] of Object.entries(params)) {
      const str = String(value)
      text = text.split(`{${name}}`).join(str)
      text = text.split(`\${${name}}`).join(str)
    }
  }

  return text
}
