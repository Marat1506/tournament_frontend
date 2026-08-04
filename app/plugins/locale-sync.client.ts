export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  const { setLocale, locale } = useI18n()

  watch(
    () => auth.user?.locale,
    (userLocale) => {
      if (userLocale && userLocale !== locale.value && ['ru', 'en', 'es'].includes(userLocale)) {
        setLocale(userLocale as 'ru' | 'en' | 'es')
      }
    },
    { immediate: true },
  )
})
