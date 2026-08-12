<script setup lang="ts">
import type { Photo } from '~/types'

const { t } = useI18n()
const auth = useAuthStore()
const favorites = useFavoritesStore()
const api = useApi()

const photoMap = ref<Record<string, Photo>>({})
const loading = ref(false)

async function loadFavoritePhotos() {
  if (loading.value) return
  loading.value = true
  try {
    if (auth.isLoggedIn) {
      const photos = favorites.synced
        ? ((await api.getFavorites()).data ?? [])
        : await favorites.syncFromServer()
      photoMap.value = Object.fromEntries(photos.map(p => [p.id, p]))
      return
    }

    if (!favorites.ids.length) {
      photoMap.value = {}
      return
    }
    const results = await Promise.all(
      favorites.ids.map(id => api.getPhoto(id).catch(() => null)),
    )
    const next: Record<string, Photo> = {}
    const validIds: string[] = []
    for (let i = 0; i < results.length; i++) {
      const photo = results[i]
      if (photo) {
        next[photo.id] = photo
        validIds.push(favorites.ids[i]!)
      }
    }
    photoMap.value = next
    if (validIds.length !== favorites.ids.length) {
      favorites.setIds(validIds)
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadFavoritePhotos)
watch(() => auth.isLoggedIn, loadFavoritePhotos)
watch(
  () => favorites.ids.join(','),
  (next, prev) => {
    if (prev !== undefined && next !== prev) {
      loadFavoritePhotos()
    }
  },
)

const photos = computed(() => Object.values(photoMap.value))
</script>

<template>
  <div>
    <AppPageHeader :title="t('favorites.title')" />
    <div class="page-container">
      <PhotoGrid :photos="photos" :loading="loading" />
      <p v-if="!loading && !photos.length" class="mt-8 text-center text-gray-500">
        {{ t('favorites.empty') }}
      </p>
      <p v-if="!auth.isLoggedIn && photos.length" class="mt-4 text-center text-xs text-gray-400">
        {{ t('favorites.syncHint') }}
      </p>
    </div>
  </div>
</template>
