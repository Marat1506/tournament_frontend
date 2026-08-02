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

  function setSession(tokens: { access_token: string; refresh_token: string; user: User }) {
    accessToken.value = tokens.access_token
    refreshToken.value = tokens.refresh_token
    user.value = tokens.user
    if (import.meta.client) {
      localStorage.setItem(ACCESS_KEY, tokens.access_token)
      localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
    }
  }

  function logout() {
    user.value = null
    accessToken.value = ''
    refreshToken.value = ''
    if (import.meta.client) {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
    }
  }

  const isLoggedIn = computed(() => !!accessToken.value)
  const isPhotographer = computed(() => user.value?.role === 'photographer')

  hydrate()

  return { user, accessToken, refreshToken, setSession, logout, isLoggedIn, isPhotographer, hydrate }
})
