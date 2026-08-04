<script setup lang="ts">
const { t } = useI18n()
const api = useApi()
const search = ref('')

const { data, pending, refresh } = await useAsyncData(
  'tournaments',
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
    <AppPageHeader :title="t('tournaments.title')" />

    <div class="page-container">
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
          v-for="t in data.data"
          :key="t.id"
          :tournament="t"
        />
      </div>

      <div v-else class="card p-10 text-center text-gray-500">
        {{ t('tournaments.notFound') }}
      </div>
    </div>
  </div>
</template>
