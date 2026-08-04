<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
const auth = useAuthStore()
const route = useRoute()
const api = useApi()
const id = route.params.id as string

if (!auth.isLoggedIn) {
  await navigateTo('/photographer/login')
}

const { data: stats, pending } = await useAsyncData(`stats-${id}`, () => api.getTournamentStats(id))
const { data: tournaments } = await useAsyncData('stats-tournament', () => api.getMyTournaments())
const tournament = computed(() => tournaments.value?.data?.find(item => item.id === id))
</script>

<template>
  <div>
    <AppPageHeader :title="t('photographer.statsTitle')">
      <template #left>
        <NuxtLink :to="`/photographer/tournaments/${id}`" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container">
      <p v-if="tournament" class="mb-4 text-sm text-gray-500">{{ tournament.name }}</p>

      <div v-if="pending" class="grid grid-cols-2 gap-3">
        <div v-for="n in 4" :key="n" class="card h-24 animate-pulse bg-white/10" />
      </div>

      <div v-else-if="stats" class="grid grid-cols-2 gap-3">
        <div class="card p-4">
          <div class="text-2xl font-bold">{{ stats.photo_count }}</div>
          <div class="text-sm text-gray-500">{{ t('photographer.statPhotos') }}</div>
        </div>
        <div class="card p-4">
          <div class="text-2xl font-bold">{{ stats.athlete_count }}</div>
          <div class="text-sm text-gray-500">{{ t('photographer.statAthletes') }}</div>
        </div>
        <div class="card p-4">
          <div class="text-2xl font-bold">{{ stats.orders_count }}</div>
          <div class="text-sm text-gray-500">{{ t('photographer.statOrders') }}</div>
        </div>
        <div class="card p-4">
          <div class="text-2xl font-bold">${{ stats.revenue.toFixed(0) }}</div>
          <div class="text-sm text-gray-500">{{ t('photographer.statRevenue') }}</div>
        </div>
        <div class="card col-span-2 p-4">
          <div class="text-2xl font-bold">{{ stats.photos_sold }}</div>
          <div class="text-sm text-gray-500">{{ t('photographer.statPhotosSold') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
