import { defineStore } from 'pinia'
import type { User } from '~/types'

const ACCESS_KEY = 'bjj_access_token'
const REFRESH_KEY = 'bjj_refresh_token'
const USER_KEY = 'bjj_user'

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
    if (import.meta.client) {
      localStorage.setItem(ACCESS_KEY, tokens.access_token)
      localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
      persistUser()
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
    if (import.meta.client) {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
      localStorage.removeItem(USER_KEY)
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

  const isLoggedIn = computed(() => !!accessToken.value)
  const isPhotographer = computed(() => user.value?.role === 'photographer')
  const isApprovedPhotographer = computed(() =>
    isPhotographer.value && user.value?.status === 'approved',
  )
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isEmailVerified = computed(() => !!user.value?.email_verified)

  return {
    user, accessToken, refreshToken, setSession, setUser, logout,
    isLoggedIn, isPhotographer, isApprovedPhotographer, isAdmin, isEmailVerified, hydrate,
  }
})
