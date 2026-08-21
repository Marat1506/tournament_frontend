<script setup lang="ts">
import type { Photo } from '~/types'

definePageMeta({ ssr: false })

const route = useRoute()
const slug = route.params.slug as string
const athleteId = route.query.athlete_id as string | undefined
const athleteName = route.query.athlete_name as string | undefined
const api = useApi()
const selection = useSelectionStore()
const favorites = useFavoritesStore()
const { t } = useI18n()
const { filtersFromRoute, filtersToQuery, activeFilterCount } = useCategoryFilterOptions()

const tab = ref<'all' | 'favorites'>('all')
const view = ref<'grid' | 'list'>('grid')
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
    selection.setContext(tournament.value.id, tournament.value.payouts_ready !== false)
    selection.setReturnPath(route.fullPath)
  }
})

const { data: photosResponse, pending, refresh } = await useAsyncData(
  () => `photos-${slug}-${athleteId}-${JSON.stringify(filters.value)}`,
  async () => {
    return api.getPhotos(slug, { athlete_id: athleteId, ...filtersToQuery(filters.value), page: 1, limit: pageSize })
  },
  { watch: [filters] },
)

watch(photosResponse, (response) => {
  if (!response) return
  page.value = 1
  allPhotos.value = response.data ?? []
  totalPhotos.value = response.pagination?.total ?? allPhotos.value.length
}, { immediate: true })

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

const allSelected = computed(() =>
  displayedPhotos.value.length > 0
  && displayedPhotos.value.every(p => selection.has(p.id)),
)

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

function toggleSelectAll() {
  if (allSelected.value) {
    for (const photo of displayedPhotos.value) {
      if (selection.has(photo.id)) selection.toggle(photo)
    }
    return
  }
  selection.selectAll(displayedPhotos.value)
}
</script>

<template>
  <div class="page-with-floating-cta">
    <AppPageHeader :title="t('tournaments.findMyPhotos')">
      <template #left>
        <NuxtLink :to="`/tournaments/${slug}`" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container !pt-0">
      <SearchStepper :current="3" tournament-to="/tournaments" />

      <h2 class="text-xl font-bold">{{ t('search.yourPhotos') }}</h2>
      <div class="mt-3 flex items-start gap-2 rounded-xl bg-brand-600/10 px-3 py-2.5 text-sm text-gray-300 ring-1 ring-brand-500/20">
        <AppIcon name="lock" class="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
        <span>{{ t('search.watermarkHint') }}</span>
      </div>

      <div v-if="tournament && tournament.payouts_ready === false" class="mt-4">
        <AppAlert type="info" :message="t('cart.errorPayouts')" />
      </div>

      <div v-if="athleteName" class="mt-4 space-y-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">{{ t('gallery.resultsFor') }} <strong class="text-white">{{ athleteName }}</strong></span>
          <NuxtLink :to="`/tournaments/${slug}/search`" class="font-medium text-brand-400">{{ t('gallery.change') }}</NuxtLink>
        </div>
        <button
          v-if="tournament && totalPhotos && tournament.payouts_ready !== false"
          class="w-full rounded-xl bg-brand-600/15 px-4 py-3 text-left text-sm font-semibold text-brand-300 ring-1 ring-brand-500/30"
          @click="buyBundle"
        >
          {{ t('gallery.buyBundle', { count: totalPhotos, price: tournament.price_bundle }) }}
        </button>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <button
          class="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold ring-1"
          :class="view === 'grid' ? 'bg-brand-600/20 text-brand-300 ring-brand-500/50' : 'text-gray-400 ring-white/10'"
          @click="view = 'grid'"
        >
          <AppIcon name="grid" class="h-4 w-4" />
          {{ t('search.viewGrid') }}
        </button>
        <button
          class="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold ring-1"
          :class="view === 'list' ? 'bg-brand-600/20 text-brand-300 ring-brand-500/50' : 'text-gray-400 ring-white/10'"
          @click="view = 'list'"
        >
          <AppIcon name="list" class="h-4 w-4" />
          {{ t('search.viewList') }}
        </button>
        <button
          class="ml-auto inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium"
          :class="filterCount ? 'bg-brand-600/20 text-brand-300' : 'text-gray-500'"
          @click="showFilters = true"
        >
          <AppIcon name="filter" class="h-4 w-4" />
          {{ t('common.filters') }}
        </button>
      </div>

      <div class="mt-3 flex items-center justify-between gap-3 text-sm">
        <span class="text-gray-400">{{ t('search.shownOf', { shown: displayedPhotos.length, total: totalPhotos }) }}</span>
        <label class="flex items-center gap-2 text-gray-300">
          <input
            type="checkbox"
            class="input-check"
            :checked="allSelected"
            @change="toggleSelectAll"
          >
          {{ t('search.selectAll') }}
        </label>
      </div>

      <div class="mt-4 flex gap-5 border-b border-white/10">
        <button
          class="pb-3 text-sm font-semibold"
          :class="tab === 'all' ? 'border-b-2 border-brand-600 text-brand-400' : 'text-gray-500'"
          @click="tab = 'all'"
        >
          {{ t('gallery.tabAll') }} ({{ totalPhotos }})
        </button>
        <button
          class="pb-3 text-sm font-semibold"
          :class="tab === 'favorites' ? 'border-b-2 border-brand-600 text-brand-400' : 'text-gray-500'"
          @click="tab = 'favorites'"
        >
          {{ t('gallery.tabFavorites') }} ({{ favoriteCount }})
        </button>
      </div>

      <div class="mt-4">
        <PhotoGrid
          :photos="displayedPhotos"
          :loading="pending"
          selectable
          :purchases-enabled="tournament?.payouts_ready !== false"
          :athlete-id="athleteId"
          :layout="view"
        />
      </div>

      <div v-if="hasMore && tab === 'all'" class="mt-6 text-center">
        <button class="btn-secondary justify-center" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? t('gallery.loadingMore') : t('gallery.loadMoreSimple') }}
          <AppIcon name="chevron" class="h-4 w-4 rotate-90" />
        </button>
      </div>

      <p v-if="!pending && !displayedPhotos.length" class="py-8 text-center text-sm text-gray-500">
        {{ tab === 'favorites' ? t('gallery.noFavorites') : t('gallery.noPhotos') }}
      </p>
    </div>

    <div class="floating-above-nav">
      <div class="card flex items-center gap-3 p-3 shadow-lg">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
          <AppIcon name="cart" class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-semibold">{{ t('search.selectedCount', { count: selection.count }) }}</div>
          <div class="text-xs text-gray-400">${{ selection.total.toFixed(2) }}</div>
          <button
            v-if="selection.count"
            class="text-xs font-medium text-brand-400"
            @click="selection.clear()"
          >
            {{ t('search.clearSelection') }}
          </button>
        </div>
        <NuxtLink
          :to="`/cart?tournament_id=${tournament?.id}`"
          class="rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white"
          :class="{ 'pointer-events-none opacity-40': !selection.count }"
        >
          {{ t('search.toCart') }} ›
        </NuxtLink>
      </div>
    </div>

    <CategoryFilterPanel v-model="filters" :open="showFilters" @update:model-value="onFiltersApply" @update:open="showFilters = $event" />
  </div>
</template>
