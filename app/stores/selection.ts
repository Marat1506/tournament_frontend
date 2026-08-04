import { defineStore } from 'pinia'
import type { Photo } from '~/types'

export const useSelectionStore = defineStore('selection', () => {
  const items = ref<Photo[]>([])
  const bundle = ref<{ athleteId: string; athleteName: string; price: number } | null>(null)
  const tournamentId = ref<string>('')

  function toggle(photo: Photo) {
    bundle.value = null
    const idx = items.value.findIndex(p => p.id === photo.id)
    if (idx >= 0) {
      items.value.splice(idx, 1)
    } else {
      items.value.push(photo)
    }
  }

  function setBundle(athleteId: string, athleteName: string, price: number) {
    items.value = []
    bundle.value = { athleteId, athleteName, price }
  }

  function setContext(id: string) {
    if (tournamentId.value && tournamentId.value !== id) {
      items.value = []
      bundle.value = null
    }
    tournamentId.value = id
  }

  function has(id: string) {
    return items.value.some(p => p.id === id)
  }

  function clear() {
    items.value = []
    bundle.value = null
  }

  const count = computed(() => items.value.length + (bundle.value ? 1 : 0))
  const total = computed(() => {
    if (bundle.value) return bundle.value.price
    return items.value.reduce((sum, p) => sum + p.price, 0)
  })

  return { items, bundle, tournamentId, toggle, setBundle, setContext, has, clear, count, total }
})
