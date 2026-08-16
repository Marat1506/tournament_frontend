export function useNotificationBadge() {
  const auth = useAuthStore()
  const api = useApi()
  const unreadCount = ref(0)

  const canLoad = computed(() =>
    auth.isLoggedIn && auth.user?.role === 'client' && !!auth.user?.email_verified,
  )

  async function refresh() {
    if (!canLoad.value) {
      unreadCount.value = 0
      return
    }
    try {
      const { count } = await api.getUnreadNotificationCount()
      unreadCount.value = count
    }
    catch {
      unreadCount.value = 0
    }
  }

  if (import.meta.client) {
    watch(canLoad, (ok) => {
      if (ok) refresh()
      else unreadCount.value = 0
    }, { immediate: true })
  }

  return { unreadCount, refresh, canLoad }
}
