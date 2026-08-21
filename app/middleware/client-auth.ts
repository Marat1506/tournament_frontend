export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const auth = useAuthStore()
  const api = useApi()
  await auth.restoreSession()

  if (!auth.isLoggedIn) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (!auth.user) {
    try {
      auth.setUser(await api.me())
    }
    catch (e: unknown) {
      if (httpStatus(e) === 401) {
        auth.logout()
        return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
      }
    }
  }

  if (auth.isAdmin) {
    return navigateTo('/admin')
  }
  if (auth.isPhotographer) {
    return navigateTo('/photographer/dashboard')
  }
  if (
    auth.user?.role === 'client'
    && !auth.user?.email_verified
    && to.path !== '/confirm-email'
  ) {
    return navigateTo('/confirm-email')
  }
})
