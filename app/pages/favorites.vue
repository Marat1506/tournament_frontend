<script setup lang="ts">
import type { Photo } from '~/types'

definePageMeta({ ssr: false })

const { t } = useI18n()
const auth = useAuthStore()
const favorites = useFavoritesStore()
const selection = useSelectionStore()
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
  }
  finally {
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

function buySelected() {
  if (!selection.count) return
  const tid = selection.tournamentId || photos.value[0]?.tournament_id
  navigateTo(tid ? `/cart?tournament_id=${tid}` : '/cart')
}
</script>

<template>
  <div class="page-with-floating-cta">
    <AppPageHeader :title="t('favorites.title')" />
    <div class="page-container">
      <p class="mb-4 text-sm text-gray-400">{{ t('profile.favoritesHint') }}</p>
      <PhotoGrid :photos="photos" :loading="loading" selectable />
      <p v-if="!loading && !photos.length" class="mt-8 text-center text-gray-500">
        {{ t('favorites.empty') }}
      </p>
      <p v-if="!auth.isLoggedIn && photos.length" class="mt-4 text-center text-xs text-gray-400">
        {{ t('favorites.syncHint') }}
      </p>
    </div>

    <div v-if="photos.length" class="floating-above-nav">
      <div class="card flex items-center gap-3 p-3 shadow-lg">
        <div class="min-w-0 flex-1">
          <div class="text-sm font-semibold">{{ t('search.selectedCount', { count: selection.count }) }}</div>
          <div class="text-xs text-gray-400">${{ selection.total.toFixed(2) }}</div>
        </div>
        <button
          class="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          :disabled="!selection.count"
          @click="buySelected"
        >
          {{ t('search.goToPay') }}
        </button>
      </div>
    </div>
  </div>
</template>
