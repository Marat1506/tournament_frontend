<script setup lang="ts">
const { t } = useI18n()
const api = useApi()
const search = ref('')
const period = ref<'active' | 'past'>('active')

const { data, pending, refresh } = await useAsyncData(
  () => `tournaments-${period.value}-${search.value}`,
  () => api.getTournaments(search.value || undefined, period.value),
)

let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => refresh(), 300)
})

watch(period, () => refresh())
</script>

<template>
  <div>
    <AppPageHeader :title="t('tournaments.title')" />

    <div class="page-container">
      <div class="mb-4 flex gap-2">
        <button
          class="rounded-full px-4 py-2 text-sm font-semibold"
          :class="period === 'active' ? 'bg-brand-600 text-white' : 'bg-white/10 text-gray-400'"
          @click="period = 'active'"
        >
          {{ t('tournaments.tabActive') }}
        </button>
        <button
          class="rounded-full px-4 py-2 text-sm font-semibold"
          :class="period === 'past' ? 'bg-brand-600 text-white' : 'bg-white/10 text-gray-400'"
          @click="period = 'past'"
        >
          {{ t('tournaments.tabPast') }}
        </button>
      </div>

      <input
        v-model="search"
        type="search"
        :placeholder="t('tournaments.searchPlaceholder')"
        class="input-field mb-4"
      >

      <div v-if="pending" class="space-y-3">
        <div v-for="n in 4" :key="n" class="card h-24 animate-pulse bg-white/10" />
      </div>

      <div v-else-if="data?.data?.length" class="space-y-3">
        <TournamentCard
          v-for="tournament in data.data"
          :key="tournament.id"
          :tournament="tournament"
        />
      </div>

      <div v-else class="card p-10 text-center text-gray-500">
        {{ t('tournaments.notFound') }}
      </div>
    </div>
  </div>
</template>
