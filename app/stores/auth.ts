import { defineStore } from 'pinia'
import type { AuthResponse, User } from '~/types'

const ACCESS_KEY = 'bjj_access_token'
const REFRESH_KEY = 'bjj_refresh_token'
const USER_KEY = 'bjj_user'

let refreshInFlight: Promise<boolean> | null = null
let cookieRestoreAttempted = false

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

  function clearLocalSession() {
    user.value = null
    accessToken.value = ''
    refreshToken.value = ''
    persistTokens()
    persistUser()
    if (import.meta.client) {
      useFavoritesStore().synced = false
    }
  }

  async function logout() {
    const currentRefresh = refreshToken.value
    clearLocalSession()
    cookieRestoreAttempted = true
    if (!import.meta.client) return
    try {
      const config = useRuntimeConfig()
      await $fetch(`${config.public.apiBase}/api/v1/auth/logout`, {
        method: 'POST',
        body: currentRefresh ? { refresh_token: currentRefresh } : {},
        credentials: 'include',
      })
    }
    catch {
      // Local session is already cleared.
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
    if (refreshInFlight) return refreshInFlight

    const currentRefresh = refreshToken.value
    refreshInFlight = (async () => {
      try {
        const config = useRuntimeConfig()
        const base = import.meta.server ? config.apiBase : config.public.apiBase
        const data = await $fetch<AuthResponse>(`${base}/api/v1/auth/refresh`, {
          method: 'POST',
          body: currentRefresh ? { refresh_token: currentRefresh } : {},
          credentials: 'include',
        })
        if (!data.access_token || !data.refresh_token) return false
        setSession(data)
        cookieRestoreAttempted = false
        return true
      }
      catch (e: unknown) {
        if (httpStatus(e) === 401) {
          clearLocalSession()
        }
        return false
      }
    })().finally(() => {
      refreshInFlight = null
    })

    return refreshInFlight
  }

  async function restoreSession(): Promise<boolean> {
    hydrate()
    if (isAccessTokenFresh(accessToken.value)) return true
    if (refreshToken.value) return refreshSession()
    if (cookieRestoreAttempted) return false
    cookieRestoreAttempted = true
    return refreshSession()
  }

  async function ensureFresh(): Promise<boolean> {
    hydrate()
    if (!accessToken.value && !refreshToken.value) return true
    if (isAccessTokenFresh(accessToken.value)) return true
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
    hydrate, ensureFresh, restoreSession, refreshSession,
  }
})
