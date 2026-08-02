import { defineStore } from 'pinia'

const STORAGE_KEY = 'bjjphotos_favorites'

export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<string[]>([])

  function load() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      ids.value = raw ? JSON.parse(raw) : []
    } catch {
      ids.value = []
    }
  }

  function persist() {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.value))
  }

  function toggle(id: string) {
    if (ids.value.includes(id)) {
      ids.value = ids.value.filter(x => x !== id)
    } else {
      ids.value = [...ids.value, id]
    }
    persist()
  }

  function has(id: string) {
    return ids.value.includes(id)
  }

  load()

  return { ids, toggle, has, load }
})
