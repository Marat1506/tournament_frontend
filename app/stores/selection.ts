import { defineStore } from 'pinia'
import type { Photo } from '~/types'

export const useSelectionStore = defineStore('selection', () => {
  const items = ref<Photo[]>([])
  const tournamentId = ref<string>('')

  function toggle(photo: Photo) {
    const idx = items.value.findIndex(p => p.id === photo.id)
    if (idx >= 0) {
      items.value.splice(idx, 1)
    } else {
      items.value.push(photo)
    }
  }

  function setContext(id: string) {
    if (tournamentId.value && tournamentId.value !== id) {
      items.value = []
    }
    tournamentId.value = id
  }

  function has(id: string) {
    return items.value.some(p => p.id === id)
  }

  function clear() {
    items.value = []
  }

  const count = computed(() => items.value.length)
  const total = computed(() => items.value.reduce((sum, p) => sum + p.price, 0))

  return { items, tournamentId, toggle, setContext, has, clear, count, total }
})
