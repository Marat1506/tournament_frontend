import { defineStore } from 'pinia'
import type { User } from '~/types'

const ACCESS_KEY = 'bjj_access_token'
const REFRESH_KEY = 'bjj_refresh_token'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref('')
  const refreshToken = ref('')

  function hydrate() {
    if (!import.meta.client) return
    accessToken.value = localStorage.getItem(ACCESS_KEY) || ''
    refreshToken.value = localStorage.getItem(REFRESH_KEY) || ''
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
      useFavoritesStore().synced = false
    }
  }

  function setUser(u: User) {
    if (user.value) {
      user.value = {
        ...user.value,
        ...u,
        email_verified: u.email_verified || user.value.email_verified,
      }
      return
    }
    user.value = u
  }

  const isLoggedIn = computed(() => !!accessToken.value)
  const isPhotographer = computed(() => user.value?.role === 'photographer')
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isEmailVerified = computed(() => !!user.value?.email_verified)

  return {
    user, accessToken, refreshToken, setSession, setUser, logout,
    isLoggedIn, isPhotographer, isAdmin, isEmailVerified, hydrate,
  }
})
