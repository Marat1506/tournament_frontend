export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  const { setLocale, locale } = useI18n()
  const localeCookie = useCookie<'ru' | 'en' | 'es'>('bjj_locale')

  onNuxtReady(() => {
    watch(
      () => auth.user?.locale,
      (userLocale) => {
        if (!userLocale || !['ru', 'en', 'es'].includes(userLocale)) return
        if (userLocale === locale.value) return
        setLocale(userLocale as 'ru' | 'en' | 'es')
        localeCookie.value = userLocale as 'ru' | 'en' | 'es'
      },
    )
  })
})
