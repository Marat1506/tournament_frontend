<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const api = useApi()
const { t } = useI18n()
const { filtersFromRoute, filtersToQuery, activeFilterCount, genderOptions } = useCategoryFilterOptions()

const filters = ref(filtersFromRoute(route.query))
const showFilters = ref(false)
const query = ref('')

const { data: tournament } = await useAsyncData(`tournament-${slug}`, () => api.getTournament(slug))

const { data: athletes, pending, error: loadError, refresh } = await useAsyncData(
  () => `athletes-${slug}-${JSON.stringify(filters.value)}-${query.value}`,
  () => api.searchAthletes(slug, query.value, filtersToQuery(filters.value)),
  { watch: [filters, query] },
)

const pageTitle = computed(() => {
  if (filters.value.gender) {
    return genderOptions.value.find(g => g.value === filters.value.gender)?.label || t('search.byName')
  }
  return t('search.byName')
})

const filterCount = computed(() => activeFilterCount(filters.value))

let queryTimer: ReturnType<typeof setTimeout>
watch(query, () => {
  clearTimeout(queryTimer)
  queryTimer = setTimeout(() => refresh(), 300)
})

function selectAthlete(id: string, name: string) {
  const q = new URLSearchParams({ athlete_id: id, athlete_name: name, ...filtersToQuery(filters.value) })
  navigateTo(`/tournaments/${slug}/photos?${q.toString()}`)
}

function onFiltersApply(v: typeof filters.value) {
  filters.value = v
  refresh()
}
</script>

<template>
  <div class="page-with-floating-cta">
    <AppPageHeader :title="t('tournaments.findMyPhotos')">
      <template #left>
        <NuxtLink to="/tournaments" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
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

    <div class="page-container">
      <SearchStepper :current="2" tournament-to="/tournaments" />
      <SearchModeTabs :slug="slug" mode="name" />

      <h1 class="text-2xl font-bold tracking-tight">{{ pageTitle }}</h1>
      <p class="mt-2 text-sm leading-relaxed text-gray-400">{{ t('search.nameHint') }}</p>

      <input
        v-model="query"
        type="search"
        :placeholder="t('search.namePlaceholder')"
        class="input-field mt-5"
        autofocus
      >
      <p class="mt-2 text-xs text-gray-500">{{ t('search.startTyping') }}</p>

      <div v-if="pending" class="mt-4 space-y-2">
        <div v-for="n in 4" :key="n" class="card h-16 animate-pulse bg-white/10" />
      </div>

      <div v-else-if="loadError" class="card mt-4 space-y-3 p-5 text-center">
        <AppAlert type="error" :message="t('errors.network')" />
        <button type="button" class="btn-secondary justify-center" @click="refresh()">{{ t('common.retry') }}</button>
      </div>

      <div v-else-if="(athletes?.data ?? []).length" class="mt-4 space-y-2">
        <button
          v-for="athlete in athletes?.data ?? []"
          :key="athlete.id"
          class="card flex w-full items-center justify-between p-4 text-left transition active:scale-[0.99]"
          @click="selectAthlete(athlete.id, athlete.name)"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600/20 text-brand-400">
              <AppIcon name="user" class="h-5 w-5" />
            </div>
            <div>
              <div class="font-semibold">{{ athlete.name }}</div>
              <div v-if="athlete.category" class="text-sm text-gray-500">{{ athlete.category }}</div>
            </div>
          </div>
          <div class="text-sm font-semibold text-brand-400">{{ t('tournaments.uploadedCount', { count: athlete.photo_count }) }}</div>
        </button>
      </div>

      <div v-else-if="query.length >= 1 || filterCount" class="card mt-4 p-8 text-center text-gray-400">
        {{ t('search.notFound') }}
      </div>

      <div v-else class="card mt-4 p-6 text-center">
        <p class="text-sm text-gray-400">{{ t('search.noNamesYet') }}</p>
      </div>

      <SelectedTournamentCard v-if="tournament" class="mt-4" :tournament="tournament" change-to="/tournaments" />
    </div>

    <CategoryFilterPanel v-model="filters" :open="showFilters" @update:model-value="onFiltersApply" @update:open="showFilters = $event" />
  </div>
</template>
