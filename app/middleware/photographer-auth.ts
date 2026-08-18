export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const auth = useAuthStore()
  const api = useApi()
  await auth.ensureFresh()

  if (!auth.isLoggedIn) {
    return navigateTo(`/photographer/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (!auth.user) {
    try {
      auth.setUser(await api.me())
    }
    catch (e: unknown) {
      if (httpStatus(e) === 401) {
        auth.logout()
        return navigateTo(`/photographer/login?redirect=${encodeURIComponent(to.fullPath)}`)
      }
    }
  }

  if (!auth.isPhotographer) {
    return navigateTo('/photographer/login')
  }

  const status = auth.user?.status
  if (status === 'pending') {
    return navigateTo('/photographer/pending')
  }
  if (status === 'rejected') {
    return navigateTo('/photographer/login?rejected=1')
  }
})
