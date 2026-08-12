import { defineStore } from 'pinia'
import type { Photo } from '~/types'

const STORAGE_KEY = 'bjj_face_search'

type StoredFaceSearch = {
  slug: string
  results: Photo[]
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

  function persist() {
    writeStorage({ slug: slug.value, results: results.value })
  }

  function setResults(tournamentSlug: string, photos: Photo[]) {
    slug.value = tournamentSlug
    results.value = photos
    persist()
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
    if (import.meta.client) {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }

  return { slug, results, setResults, getResults, findPhoto, clear }
})
