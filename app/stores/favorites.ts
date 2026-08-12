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
    if (
      next.length === ids.value.length
      && next.every((id, i) => id === ids.value[i])
    ) {
      return
    }
    ids.value = next
    persistLocal()
  }

  async function syncFromServer(): Promise<Photo[]> {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) return []

    const api = useApi()
    const localIds = [...ids.value]

    try {
      const resp = localIds.length
        ? await api.syncFavorites(localIds)
        : await api.getFavorites()
      setIds((resp.data ?? []).map(p => p.id))
      synced.value = true
      return resp.data ?? []
    } catch {
      return []
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

  return { ids, synced, toggle, has, load, syncFromServer, setIds }
})
