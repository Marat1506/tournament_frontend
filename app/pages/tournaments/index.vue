<script setup lang="ts">
const { t } = useI18n()
const api = useApi()
const search = ref('')

const { data, pending, refresh } = await useAsyncData(
  () => `tournaments-${search.value}`,
  () => api.getTournaments(search.value || undefined),
)

let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => refresh(), 300)
})
</script>

<template>
  <div>
    <AppPageHeader :title="t('tournaments.findMyPhotos')">
      <template #left>
        <NuxtLink to="/" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container">
      <SearchStepper :current="1" tournament-to="/tournaments" />

      <h2 class="text-xl font-bold">{{ t('tournaments.chooseEventTitle') }}</h2>
      <p class="mt-2 text-sm text-gray-400">{{ t('tournaments.listHint') }}</p>

      <div class="mt-4 flex gap-2">
        <div class="relative flex-1">
          <AppIcon name="search" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            v-model="search"
            type="search"
            :placeholder="t('tournaments.searchPlaceholder')"
            class="input-field pl-10"
          >
        </div>
      </div>

      <div class="mb-3 mt-6 flex items-center justify-between">
        <h3 class="font-semibold">{{ t('home.recentTournaments') }}</h3>
        <span class="text-sm text-brand-400">{{ t('home.viewAll') }} ›</span>
      </div>

      <div v-if="pending" class="space-y-3">
        <div v-for="n in 4" :key="n" class="card h-28 animate-pulse bg-white/10" />
      </div>

      <div v-else-if="data?.data?.length" class="space-y-3">
        <TournamentCard
          v-for="tournament in data.data"
          :key="tournament.id"
          :tournament="tournament"
          layout="list"
        />
      </div>

      <div v-else class="card p-10 text-center text-gray-500">
        {{ t('tournaments.notFound') }}
      </div>

      <div class="card mt-6 flex items-start gap-3 bg-brand-600/10 p-4 ring-brand-500/20">
        <div class="icon-tile">
          <AppIcon name="help" class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-semibold">{{ t('home.needHelpEvent') }}</div>
          <p class="mt-1 text-sm text-gray-400">{{ t('home.needHelpEventHint') }}</p>
          <NuxtLink to="/support" class="btn-outline mt-3">{{ t('home.contactUs') }}</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
