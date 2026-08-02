<script setup lang="ts">
import type { Photo } from '~/types'

const favorites = useFavoritesStore()
const api = useApi()

const photoMap = ref<Record<string, Photo>>({})
const loading = ref(false)

async function loadFavoritePhotos() {
  if (!favorites.ids.length) return
  loading.value = true
  try {
    const results = await Promise.all(
      favorites.ids.map(id => api.getPhoto(id).catch(() => null)),
    )
    for (const photo of results) {
      if (photo) photoMap.value[photo.id] = photo
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadFavoritePhotos)
watch(() => favorites.ids.length, loadFavoritePhotos)

const photos = computed(() => Object.values(photoMap.value))
</script>

<template>
  <div>
    <AppPageHeader title="Избранное" />
    <div class="page-container">
      <PhotoGrid :photos="photos" :loading="loading" />
      <p v-if="!loading && !photos.length" class="mt-8 text-center text-gray-500">
        Пока пусто — нажмите ♡ на фото в галерее
      </p>
    </div>
  </div>
</template>
