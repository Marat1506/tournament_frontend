import { defineStore } from 'pinia'
import type { Photo } from '~/types'

const STORAGE_KEY = 'bjj_selection'

type StoredSelection = {
  items: Photo[]
  bundle: { athleteId: string; athleteName: string; price: number } | null
  tournamentId: string
}

function readStorage(): StoredSelection | null {
  if (!import.meta.client) return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredSelection
  }
  catch {
    return null
  }
}

function writeStorage(state: StoredSelection) {
  if (!import.meta.client) return
  if (!state.items.length && !state.bundle && !state.tournamentId) {
    sessionStorage.removeItem(STORAGE_KEY)
    return
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const useSelectionStore = defineStore('selection', () => {
  const stored = readStorage()
  const items = ref<Photo[]>(stored?.items ?? [])
  const bundle = ref<{ athleteId: string; athleteName: string; price: number } | null>(stored?.bundle ?? null)
  const tournamentId = ref<string>(stored?.tournamentId ?? '')

  function persist() {
    writeStorage({
      items: items.value,
      bundle: bundle.value,
      tournamentId: tournamentId.value,
    })
  }

  watch([items, bundle, tournamentId], persist, { deep: true })

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
    if (import.meta.client) {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }

  const count = computed(() => items.value.length + (bundle.value ? 1 : 0))
  const total = computed(() => {
    if (bundle.value) return bundle.value.price
    return items.value.reduce((sum, p) => sum + p.price, 0)
  })

  return { items, bundle, tournamentId, toggle, setBundle, setContext, has, clear, count, total }
})
