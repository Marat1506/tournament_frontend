export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  const api = useApi()

  if (!auth.accessToken) return

  try {
    auth.setUser(await api.me())
  } catch {
    auth.logout()
  }
})
