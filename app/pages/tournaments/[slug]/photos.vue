<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const athleteId = route.query.athlete_id as string | undefined
const athleteName = route.query.athlete_name as string | undefined
const api = useApi()
const selection = useSelectionStore()
const favorites = useFavoritesStore()

const tab = ref<'all' | 'favorites'>('all')

const { data: tournament } = await useAsyncData(`tournament-${slug}`, () => api.getTournament(slug))

watchEffect(() => {
  if (tournament.value?.id) {
    selection.setContext(tournament.value.id)
  }
})

const { data: photos, pending } = await useAsyncData(
  `photos-${slug}-${athleteId}`,
  () => api.getPhotos(slug, { athlete_id: athleteId, limit: 100 }),
)

const favoriteCount = computed(() =>
  (photos.value?.data ?? []).filter(p => favorites.has(p.id)).length,
)

const displayedPhotos = computed(() => {
  const list = photos.value?.data ?? []
  if (tab.value === 'favorites') {
    return list.filter(p => favorites.has(p.id))
  }
  return list
})
</script>

<template>
  <div class="pb-32">
    <AppPageHeader title="Фото с турнира">
      <template #left>
        <NuxtLink :to="`/tournaments/${slug}/search`" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
      <template #right>
        <button class="flex h-10 w-10 items-center justify-center rounded-full text-gray-500" aria-label="Фильтр">
          <AppIcon name="filter" class="h-5 w-5" />
        </button>
      </template>
    </AppPageHeader>

    <div class="page-container !pt-0">
      <TournamentCard v-if="tournament" :tournament="tournament" compact class="mb-4" />

      <div v-if="athleteName" class="mb-4 flex items-center justify-between text-sm">
        <span class="text-gray-600">Результаты для: <strong class="text-gray-900">{{ athleteName }}</strong></span>
        <NuxtLink :to="`/tournaments/${slug}/search`" class="font-medium text-brand-600">Изменить</NuxtLink>
      </div>

      <div class="mb-4 flex gap-5 border-b border-gray-200">
        <button
          class="pb-3 text-sm font-semibold"
          :class="tab === 'all' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500'"
          @click="tab = 'all'"
        >
          Все фото ({{ photos?.pagination?.total ?? 0 }})
        </button>
        <button
          class="pb-3 text-sm font-semibold"
          :class="tab === 'favorites' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500'"
          @click="tab = 'favorites'"
        >
          Избранное ({{ favoriteCount }})
        </button>
      </div>

      <PhotoGrid :photos="displayedPhotos" :loading="pending" selectable />
    </div>

    <div class="fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-40 px-4">
      <NuxtLink
        v-if="selection.count"
        :to="`/cart?tournament_id=${tournament?.id}`"
        class="btn-primary-solid block text-center"
      >
        В корзину ({{ selection.count }}) · ${{ selection.total.toFixed(0) }}
      </NuxtLink>
      <button v-else class="btn-primary-solid" disabled>
        Выберите фото
      </button>
    </div>
  </div>
</template>
