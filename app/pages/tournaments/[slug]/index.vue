<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const api = useApi()
const { t } = useI18n()

const { data: tournament, error } = await useAsyncData(`tournament-${slug}`, () => api.getTournament(slug))
const { data: recent } = await useAsyncData('recent-tournaments', () => api.getTournaments())

const activeCategory = computed(() => (route.query.gender as string) || 'all')
const categories = computed(() => [
  { id: 'all', label: t('tournaments.categoryAll') },
  { id: 'male', label: t('tournaments.categoryMale') },
  { id: 'female', label: t('tournaments.categoryFemale') },
  { id: 'child', label: t('tournaments.categoryChild') },
  { id: 'masters', label: t('tournaments.categoryMasters') },
])

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: t('tournaments.notFoundOne') })
}
</script>

<template>
  <div v-if="tournament">
    <AppPageHeader :title="t('tournaments.findMyPhotos')" show-help>
      <template #left>
        <NuxtLink to="/tournaments" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container">
      <SearchStepper :current="2" />

      <TournamentCard :tournament="tournament" compact class="mb-5" />

      <p class="mb-3 text-base font-semibold">{{ t('tournaments.chooseSearch') }}</p>

      <div class="grid grid-cols-2 gap-3">
        <NuxtLink :to="`/tournaments/${slug}/search`" class="search-card">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <AppIcon name="user" class="h-6 w-6" />
          </div>
          <div>
            <div class="font-semibold">{{ t('tournaments.searchByName') }}</div>
            <div class="mt-1 text-xs text-gray-500">{{ t('tournaments.searchByNameHint') }}</div>
          </div>
        </NuxtLink>

        <NuxtLink :to="`/tournaments/${slug}/search/face`" class="search-card">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <AppIcon name="face" class="h-6 w-6" />
          </div>
          <div>
            <div class="font-semibold">{{ t('tournaments.searchByFace') }}</div>
            <div class="mt-1 text-xs text-gray-500">{{ t('tournaments.searchByFaceHint') }}</div>
          </div>
        </NuxtLink>
      </div>

      <div class="mt-6 flex gap-2 overflow-x-auto pb-1">
        <NuxtLink
          v-for="cat in categories"
          :key="cat.id"
          :to="cat.id === 'all' ? `/tournaments/${slug}/search` : `/tournaments/${slug}/search?gender=${cat.id}`"
          class="chip"
          :class="activeCategory === cat.id ? 'chip-active' : 'chip-inactive'"
        >
          {{ cat.label }}
        </NuxtLink>
      </div>

      <section v-if="recent?.data?.length" class="mt-8">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="font-semibold">{{ t('home.recentTournaments') }}</h2>
          <NuxtLink to="/tournaments" class="text-sm font-medium text-brand-600">{{ t('home.viewAll') }}</NuxtLink>
        </div>
        <div class="-mx-1 flex items-stretch gap-3 overflow-x-auto pb-2">
          <div
            v-for="t in recent.data.filter(x => x.slug !== slug).slice(0, 4)"
            :key="t.id"
            class="flex w-[132px] shrink-0"
          >
            <TournamentCard :tournament="t" layout="tile" class="w-full" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
