import { defineStore } from 'pinia'
import type { AuthResponse, User } from '~/types'

const ACCESS_KEY = 'bjj_access_token'
const REFRESH_KEY = 'bjj_refresh_token'
const USER_KEY = 'bjj_user'

let refreshInFlight: Promise<boolean> | null = null

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref('')
  const refreshToken = ref('')

  function persistUser() {
    if (!import.meta.client) return
    if (user.value) {
      localStorage.setItem(USER_KEY, JSON.stringify(user.value))
      return
    }
    localStorage.removeItem(USER_KEY)
  }

  function persistTokens() {
    if (!import.meta.client) return
    if (accessToken.value) localStorage.setItem(ACCESS_KEY, accessToken.value)
    else localStorage.removeItem(ACCESS_KEY)
    if (refreshToken.value) localStorage.setItem(REFRESH_KEY, refreshToken.value)
    else localStorage.removeItem(REFRESH_KEY)
  }

  function hydrate() {
    if (!import.meta.client) return
    accessToken.value = localStorage.getItem(ACCESS_KEY) || ''
    refreshToken.value = localStorage.getItem(REFRESH_KEY) || ''
    if (user.value || !accessToken.value) return
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return
    try {
      user.value = JSON.parse(raw) as User
    }
    catch {
      localStorage.removeItem(USER_KEY)
    }
  }

  function setSession(tokens: { access_token?: string; refresh_token?: string; user: User }) {
    if (!tokens.access_token || !tokens.refresh_token) {
      return
    }
    accessToken.value = tokens.access_token
    refreshToken.value = tokens.refresh_token
    user.value = tokens.user
    persistTokens()
    persistUser()
    if (import.meta.client) {
      const skipSync = tokens.user.role === 'client' && !tokens.user.email_verified
      if (!skipSync) {
        const favorites = useFavoritesStore()
        favorites.synced = false
        favorites.syncFromServer()
      }
    }
  }

  function logout() {
    user.value = null
    accessToken.value = ''
    refreshToken.value = ''
    persistTokens()
    persistUser()
    if (import.meta.client) {
      useFavoritesStore().synced = false
    }
  }

  function setUser(u: User) {
    if (user.value) {
      user.value = {
        ...user.value,
        ...u,
        email_verified: u.email_verified || user.value.email_verified,
        photos_public: u.photos_public ?? user.value.photos_public,
      }
    }
    else {
      user.value = u
    }
    persistUser()
  }

  async function refreshSession(): Promise<boolean> {
    hydrate()
    if (!refreshToken.value) return false
    if (refreshInFlight) return refreshInFlight

    const currentRefresh = refreshToken.value
    refreshInFlight = (async () => {
      try {
        const config = useRuntimeConfig()
        const base = import.meta.server ? config.apiBase : config.public.apiBase
        const data = await $fetch<AuthResponse>(`${base}/api/v1/auth/refresh`, {
          method: 'POST',
          body: { refresh_token: currentRefresh },
        })
        setSession(data)
        return true
      }
      catch (e: unknown) {
        if (httpStatus(e) === 401) {
          logout()
        }
        return false
      }
    })().finally(() => {
      refreshInFlight = null
    })

    return refreshInFlight
  }

  async function ensureFresh(): Promise<boolean> {
    hydrate()
    if (!accessToken.value && !refreshToken.value) return true
    if (isAccessTokenFresh(accessToken.value)) return true
    if (!refreshToken.value) {
      logout()
      return false
    }
    return refreshSession()
  }

  const isLoggedIn = computed(() => !!accessToken.value || !!refreshToken.value)
  const isPhotographer = computed(() => user.value?.role === 'photographer')
  const isApprovedPhotographer = computed(() =>
    isPhotographer.value && user.value?.status === 'approved',
  )
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isEmailVerified = computed(() => !!user.value?.email_verified)

  return {
    user, accessToken, refreshToken, setSession, setUser, logout,
    isLoggedIn, isPhotographer, isApprovedPhotographer, isAdmin, isEmailVerified,
    hydrate, ensureFresh, refreshSession,
  }
})
