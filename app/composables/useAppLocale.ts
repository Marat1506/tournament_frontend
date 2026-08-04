export type AppLocale = 'ru' | 'en' | 'es'

export function useAppLocale() {
  const { locale, setLocale } = useI18n()
  const auth = useAuthStore()
  const api = useApi()

  const localeOptions: { value: AppLocale; labelKey: string }[] = [
    { value: 'ru', labelKey: 'lang.ru' },
    { value: 'en', labelKey: 'lang.en' },
    { value: 'es', labelKey: 'lang.es' },
  ]

  async function applyLocale(code: AppLocale, persist = true) {
    await setLocale(code)
    if (persist && auth.isLoggedIn) {
      try {
        const user = await api.updateProfile({ locale: code })
        auth.setUser(user)
      } catch {
        // keep UI locale even if profile sync fails
      }
    }
  }

  return { locale, localeOptions, applyLocale }
}
