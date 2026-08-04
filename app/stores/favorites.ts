import { defineStore } from 'pinia'
import type { Photo } from '~/types'

const STORAGE_KEY = 'bjjphotos_favorites'

export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<string[]>([])
  const synced = ref(false)

  function load() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      ids.value = raw ? JSON.parse(raw) : []
    } catch {
      ids.value = []
    }
  }

  function persistLocal() {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.value))
  }

  function setIds(next: string[]) {
    ids.value = next
    persistLocal()
  }

  async function syncFromServer() {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) return

    const api = useApi()
    const localIds = [...ids.value]

    try {
      if (localIds.length) {
        const resp = await api.syncFavorites(localIds)
        setIds(resp.data.map(p => p.id))
      } else {
        const resp = await api.getFavorites()
        setIds(resp.data.map(p => p.id))
      }
      synced.value = true
    } catch {
      // keep local state on failure
    }
  }

  async function toggle(id: string) {
    const auth = useAuthStore()
    const api = useApi()
    const wasFavorite = ids.value.includes(id)

    if (wasFavorite) {
      ids.value = ids.value.filter(x => x !== id)
    } else {
      ids.value = [...ids.value, id]
    }
    persistLocal()

    if (auth.isLoggedIn) {
      try {
        if (wasFavorite) {
          await api.removeFavorite(id)
        } else {
          await api.addFavorite(id)
        }
      } catch {
        // revert on failure
        if (wasFavorite) {
          ids.value = [...ids.value, id]
        } else {
          ids.value = ids.value.filter(x => x !== id)
        }
        persistLocal()
      }
    }
  }

  function has(id: string) {
    return ids.value.includes(id)
  }

  load()

  return { ids, synced, toggle, has, load, syncFromServer, setIds }
})
