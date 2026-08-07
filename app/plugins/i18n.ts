import { LOCALES, type AppLocale } from '~/i18n/messages'

export default defineNuxtPlugin(() => {
  const cookie = useCookie<string | null>('bjj_locale')
  const locale = useState<AppLocale>('app-locale')

  const code = cookie.value && LOCALES.includes(cookie.value as AppLocale)
    ? (cookie.value as AppLocale)
    : 'ru'

  locale.value = code
})
