<script setup lang="ts">
import type { Photo } from '~/types'

const route = useRoute()
const slug = route.params.slug as string
const athleteId = route.query.athlete_id as string | undefined
const athleteName = route.query.athlete_name as string | undefined
const api = useApi()
const auth = useAuthStore()
const selection = useSelectionStore()
const favorites = useFavoritesStore()
const { t } = useI18n()
const { filtersFromRoute, filtersToQuery, activeFilterCount } = useCategoryFilterOptions()

const tab = ref<'all' | 'favorites'>('all')
const showFilters = ref(false)
const filters = ref(filtersFromRoute(route.query))
const page = ref(1)
const pageSize = 30
const allPhotos = ref<Photo[]>([])
const totalPhotos = ref(0)
const loadingMore = ref(false)

const filterCount = computed(() => activeFilterCount(filters.value))

const { data: tournament } = await useAsyncData(`tournament-${slug}`, () => api.getTournament(slug))

watchEffect(() => {
  if (tournament.value?.id) {
    selection.setContext(tournament.value.id)
  }
})

const { pending, refresh } = await useAsyncData(
  () => `photos-${slug}-${athleteId}-${JSON.stringify(filters.value)}`,
  async () => {
    page.value = 1
    const response = await api.getPhotos(slug, { athlete_id: athleteId, ...filtersToQuery(filters.value), page: 1, limit: pageSize })
    allPhotos.value = response.data ?? []
    totalPhotos.value = response.pagination?.total ?? allPhotos.value.length
    return response
  },
  { watch: [filters] },
)

if (import.meta.client && athleteId && auth.isLoggedIn && auth.user?.role === 'client') {
  api.trackAthlete(athleteId).catch(() => {})
}

const hasMore = computed(() => allPhotos.value.length < totalPhotos.value)

const favoriteCount = computed(() =>
  allPhotos.value.filter(p => favorites.has(p.id)).length,
)

const displayedPhotos = computed(() => {
  if (tab.value === 'favorites') {
    return allPhotos.value.filter(p => favorites.has(p.id))
  }
  return allPhotos.value
})

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const nextPage = page.value + 1
    const response = await api.getPhotos(slug, {
      athlete_id: athleteId,
      ...filtersToQuery(filters.value),
      page: nextPage,
      limit: pageSize,
    })
    allPhotos.value = [...allPhotos.value, ...(response.data ?? [])]
    page.value = nextPage
    totalPhotos.value = response.pagination?.total ?? totalPhotos.value
  }
  finally {
    loadingMore.value = false
  }
}

function buyBundle() {
  if (!athleteId || !athleteName || !tournament.value) return
  selection.setBundle(athleteId, athleteName, tournament.value.price_bundle)
}

function onFiltersApply(v: typeof filters.value) {
  filters.value = v
  refresh()
}
</script>

<template>
  <div class="pb-32">
    <AppPageHeader :title="t('gallery.title')">
      <template #left>
        <NuxtLink :to="`/tournaments/${slug}/search`" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
      <template #right>
        <button
          class="flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium"
          :class="filterCount ? 'bg-brand-50 text-brand-600' : 'text-gray-500'"
          @click="showFilters = true"
        >
          <AppIcon name="filter" class="h-5 w-5" />
          <span v-if="filterCount" class="hidden sm:inline">{{ t('filters.active', { count: filterCount }) }}</span>
        </button>
      </template>
    </AppPageHeader>

    <div class="page-container !pt-0">
      <TournamentCard v-if="tournament" :tournament="tournament" compact class="mb-4" />

      <div v-if="athleteName" class="mb-4 space-y-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">{{ t('gallery.resultsFor') }} <strong class="text-white">{{ athleteName }}</strong></span>
          <NuxtLink :to="`/tournaments/${slug}/search`" class="font-medium text-brand-600">{{ t('gallery.change') }}</NuxtLink>
        </div>
        <button
          v-if="tournament && totalPhotos"
          class="w-full rounded-xl bg-brand-50 px-4 py-3 text-left text-sm font-semibold text-brand-700 ring-1 ring-brand-100"
          @click="buyBundle"
        >
          {{ t('gallery.buyBundle', { count: totalPhotos, price: tournament.price_bundle }) }}
        </button>
      </div>

      <div class="mb-4 flex gap-5 border-b border-white/10">
        <button
          class="pb-3 text-sm font-semibold"
          :class="tab === 'all' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500'"
          @click="tab = 'all'"
        >
          {{ t('gallery.tabAll') }} ({{ totalPhotos }})
        </button>
        <button
          class="pb-3 text-sm font-semibold"
          :class="tab === 'favorites' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500'"
          @click="tab = 'favorites'"
        >
          {{ t('gallery.tabFavorites') }} ({{ favoriteCount }})
        </button>
      </div>

      <PhotoGrid :photos="displayedPhotos" :loading="pending" selectable />

      <div v-if="hasMore && tab === 'all'" class="mt-6 text-center">
        <button class="btn-secondary" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? t('gallery.loadingMore') : t('gallery.loadMore', { count: totalPhotos - allPhotos.length }) }}
        </button>
      </div>

      <p v-if="!pending && !displayedPhotos.length" class="py-8 text-center text-sm text-gray-500">
        {{ tab === 'favorites' ? t('gallery.noFavorites') : t('gallery.noPhotos') }}
      </p>
    </div>

    <div class="fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-40 px-4">
      <NuxtLink
        v-if="selection.count"
        :to="`/cart?tournament_id=${tournament?.id}`"
        class="btn-primary-solid block text-center"
      >
        {{ t('search.toCart', { count: selection.count, total: selection.total.toFixed(0) }) }}
      </NuxtLink>
    </div>

    <CategoryFilterPanel v-model="filters" :open="showFilters" @update:model-value="onFiltersApply" @update:open="showFilters = $event" />
  </div>
</template>
