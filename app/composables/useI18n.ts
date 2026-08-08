import { LOCALES, translate, type AppLocale } from '~/i18n/messages'

export type { AppLocale }

export function useI18n() {
  const locale = useState<AppLocale>('app-locale', () => 'ru')

  function t(key: string, params?: Record<string, string | number>): string {
    return translate(locale.value, key, params)
  }

  function setLocale(code: AppLocale) {
    if (!LOCALES.includes(code)) return
    locale.value = code
    const cookie = useCookie<AppLocale>('bjj_locale', {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    cookie.value = code
  }

  return { locale, t, setLocale }
}
