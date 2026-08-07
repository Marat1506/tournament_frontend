export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  auth.hydrate()

  onNuxtReady(async () => {
    if (!auth.accessToken) return
    const api = useApi()
    try {
      auth.setUser(await api.me())
    } catch {
      auth.logout()
    }
  })
})
