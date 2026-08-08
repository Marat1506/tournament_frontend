export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  if (!auth.isLoggedIn) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
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
