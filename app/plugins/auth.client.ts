export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  auth.hydrate()

  onNuxtReady(async () => {
    if (!auth.accessToken) return
    const api = useApi()
    const route = useRoute()
    try {
      const user = await api.me()
      auth.setUser(user)
      if (
        user.role === 'client'
        && !user.email_verified
        && route.path.startsWith('/profile')
      ) {
        await navigateTo('/confirm-email')
      }
    } catch {
      auth.logout()
    }
  })
})
