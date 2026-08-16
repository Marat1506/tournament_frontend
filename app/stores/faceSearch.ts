import { defineStore } from 'pinia'
import type { Photo } from '~/types'

const STORAGE_KEY = 'bjj_face_search'
const GUEST_TOKEN_KEY = 'bjj_guest_consent'

type StoredFaceSearch = {
  slug: string
  results: Photo[]
  guestToken?: string
}

function readGuestToken(): string {
  if (!import.meta.client) return ''
  return sessionStorage.getItem(GUEST_TOKEN_KEY) ?? ''
}

function writeGuestToken(token: string) {
  if (!import.meta.client) return
  if (token) sessionStorage.setItem(GUEST_TOKEN_KEY, token)
  else sessionStorage.removeItem(GUEST_TOKEN_KEY)
}

function readStorage(): StoredFaceSearch | null {
  if (!import.meta.client) return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredFaceSearch
  }
  catch {
    return null
  }
}

function writeStorage(state: StoredFaceSearch) {
  if (!import.meta.client) return
  if (!state.results.length) {
    sessionStorage.removeItem(STORAGE_KEY)
    return
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const useFaceSearchStore = defineStore('faceSearch', () => {
  const stored = readStorage()
  const slug = ref(stored?.slug ?? '')
  const results = ref<Photo[]>(stored?.results ?? [])
  const guestToken = ref(stored?.guestToken ?? readGuestToken())

  function persist() {
    writeStorage({ slug: slug.value, results: results.value, guestToken: guestToken.value })
  }

  function setResults(tournamentSlug: string, photos: Photo[], token?: string) {
    slug.value = tournamentSlug
    results.value = photos
    if (token) {
      guestToken.value = token
      writeGuestToken(token)
    }
    persist()
  }

  function getGuestToken() {
    return guestToken.value || readGuestToken()
  }

  function mediaUrl(url?: string | null) {
    const src = url || ''
    if (!src) return src
    const token = getGuestToken()
    if (!token || src.includes('guest_consent_token=')) return src
    const sep = src.includes('?') ? '&' : '?'
    return `${src}${sep}guest_consent_token=${encodeURIComponent(token)}`
  }

  function getResults(tournamentSlug: string) {
    return slug.value === tournamentSlug ? results.value : []
  }

  function findPhoto(photoId: string) {
    return results.value.find(p => p.id === photoId) ?? null
  }

  function clear() {
    slug.value = ''
    results.value = []
    guestToken.value = ''
    if (import.meta.client) {
      sessionStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(GUEST_TOKEN_KEY)
    }
  }

  return { slug, results, guestToken, setResults, getResults, findPhoto, getGuestToken, mediaUrl, clear }
})
