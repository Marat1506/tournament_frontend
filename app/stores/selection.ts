import { defineStore } from 'pinia'
import type { Photo } from '~/types'

const STORAGE_KEY = 'bjj_selection'

type StoredSelection = {
  items: Photo[]
  bundle: { athleteId: string; athleteName: string; price: number } | null
  tournamentId: string
  payoutsReady: boolean
  returnPath: string
  guestEmail: string
  pendingOrderId: string
  pendingSignature: string
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
  const items = ref<Photo[]>([])
  const bundle = ref<{ athleteId: string; athleteName: string; price: number } | null>(null)
  const tournamentId = ref('')
  const payoutsReady = ref(true)
  const returnPath = ref('')
  const guestEmail = ref('')
  const pendingOrderId = ref('')
  const pendingSignature = ref('')

  function persist() {
    writeStorage({
      items: items.value,
      bundle: bundle.value,
      tournamentId: tournamentId.value,
      payoutsReady: payoutsReady.value,
      returnPath: returnPath.value,
      guestEmail: guestEmail.value,
      pendingOrderId: pendingOrderId.value,
      pendingSignature: pendingSignature.value,
    })
  }

  function hydrate() {
    const stored = readStorage()
    if (!stored) return
    items.value = stored.items ?? []
    bundle.value = stored.bundle ?? null
    tournamentId.value = stored.tournamentId ?? ''
    payoutsReady.value = stored.payoutsReady ?? true
    returnPath.value = stored.returnPath ?? ''
    guestEmail.value = stored.guestEmail ?? ''
    pendingOrderId.value = stored.pendingOrderId ?? ''
    pendingSignature.value = stored.pendingSignature ?? ''
  }

  watch(
    [items, bundle, tournamentId, payoutsReady, returnPath, guestEmail, pendingOrderId, pendingSignature],
    persist,
    { deep: true },
  )

  function clearPendingOrder() {
    pendingOrderId.value = ''
    pendingSignature.value = ''
  }

  function toggle(photo: Photo) {
    clearPendingOrder()
    bundle.value = null
    const idx = items.value.findIndex(p => p.id === photo.id)
    if (idx >= 0) {
      items.value.splice(idx, 1)
    } else {
      items.value.push(photo)
    }
  }

  function setBundle(athleteId: string, athleteName: string, price: number) {
    clearPendingOrder()
    items.value = []
    bundle.value = { athleteId, athleteName, price }
  }

  function setContext(id: string, ready = true) {
    if (tournamentId.value && tournamentId.value !== id) {
      clearPendingOrder()
      items.value = []
      bundle.value = null
    }
    tournamentId.value = id
    payoutsReady.value = ready
  }

  function setReturnPath(path: string) {
    returnPath.value = path
  }

  function setGuestEmail(value: string) {
    const normalized = value.trim()
    if (guestEmail.value.toLowerCase() !== normalized.toLowerCase()) {
      clearPendingOrder()
    }
    guestEmail.value = normalized
  }

  function setPendingOrder(id: string, signature: string) {
    pendingOrderId.value = id
    pendingSignature.value = signature
  }

  function selectAll(photos: Photo[]) {
    clearPendingOrder()
    bundle.value = null
    const seen = new Set(items.value.map(p => p.id))
    for (const photo of photos) {
      if (!seen.has(photo.id)) {
        items.value.push(photo)
        seen.add(photo.id)
      }
    }
  }

  function has(id: string) {
    return items.value.some(p => p.id === id)
  }

  function clear() {
    items.value = []
    bundle.value = null
    tournamentId.value = ''
    returnPath.value = ''
    payoutsReady.value = true
    guestEmail.value = ''
    clearPendingOrder()
    if (import.meta.client) {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }

  const count = computed(() => items.value.length + (bundle.value ? 1 : 0))
  const total = computed(() => {
    if (bundle.value) return bundle.value.price
    return items.value.reduce((sum, p) => sum + p.price, 0)
  })

  return {
    items,
    bundle,
    tournamentId,
    payoutsReady,
    returnPath,
    guestEmail,
    pendingOrderId,
    pendingSignature,
    toggle,
    setBundle,
    setContext,
    setReturnPath,
    setGuestEmail,
    setPendingOrder,
    clearPendingOrder,
    has,
    selectAll,
    clear,
    hydrate,
    count,
    total,
  }
})
