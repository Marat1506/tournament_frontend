<script setup lang="ts">
definePageMeta({ middleware: 'photographer-auth', ssr: false })

const { t, locale } = useI18n()
const route = useRoute()
const api = useApi()
const id = route.params.id as string

const { data: stats, pending, error: statsError, refresh } = await useAsyncData(`stats-${id}`, () => api.getTournamentStats(id), { server: false })
const { data: tournaments } = await useAsyncData('stats-tournament', () => api.getMyTournaments(), { server: false })
const tournament = computed(() => tournaments.value?.data?.find(item => item.id === id))

const avgCheck = computed(() => {
  if (!stats.value?.orders_count) return 0
  return stats.value.revenue / stats.value.orders_count
})

function formatDate(date?: string) {
  if (!date) return ''
  const loc = locale.value === 'ru' ? 'ru-RU' : locale.value === 'es' ? 'es-ES' : 'en-US'
  return new Date(date).toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div>
    <AppPageHeader :title="tournament?.name || t('photographer.statsTitle')">
      <template #left>
        <NuxtLink to="/photographer/dashboard" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container space-y-4">
      <PhotographerEventTabs :id="id" active="sales" />

      <div v-if="tournament" class="card flex gap-3 p-3">
        <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
          <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-semibold">{{ tournament.name }}</div>
          <p class="mt-1 text-xs text-gray-400">{{ formatDate(tournament.date) }}</p>
          <p class="text-xs text-gray-400">{{ tournament.location }}</p>
          <span
            class="mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
            :class="tournament.status === 'published' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-gray-400'"
          >
            {{ tournament.status === 'published' ? t('photographer.statusPublished') : t('photographer.statusDraft') }}
          </span>
        </div>
      </div>

      <div v-if="pending" class="grid grid-cols-2 gap-3">
        <div v-for="n in 4" :key="n" class="card h-24 animate-pulse bg-white/10" />
      </div>

      <div v-else-if="statsError" class="card space-y-3 p-6 text-center">
        <AppAlert type="error" :message="t('photographer.statsLoadFailed')" />
        <button class="btn-primary-solid" @click="refresh()">{{ t('common.retry') }}</button>
      </div>

      <template v-else-if="stats">
        <h2 class="font-semibold">{{ t('photographer.salesOverview') }}</h2>
        <div class="grid grid-cols-2 gap-3">
          <div class="card p-4">
            <div class="text-2xl font-bold text-brand-400">{{ stats.photos_sold }}</div>
            <div class="text-sm text-gray-500">{{ t('photographer.statPhotosSold') }}</div>
          </div>
          <div class="card p-4">
            <div class="text-2xl font-bold text-brand-400">${{ stats.revenue.toFixed(0) }}</div>
            <div class="text-sm text-gray-500">{{ t('photographer.statRevenue') }}</div>
          </div>
          <div class="card p-4">
            <div class="text-2xl font-bold text-brand-400">${{ avgCheck.toFixed(2) }}</div>
            <div class="text-sm text-gray-500">{{ t('photographer.statAvgCheck') }}</div>
          </div>
          <div class="card p-4">
            <div class="text-2xl font-bold text-brand-400">{{ stats.view_count }}</div>
            <div class="text-sm text-gray-500">{{ t('photographer.statViews') }}</div>
          </div>
          <div class="card p-4">
            <div class="text-2xl font-bold">{{ stats.orders_count }}</div>
            <div class="text-sm text-gray-500">{{ t('photographer.statOrders') }}</div>
          </div>
          <div class="card p-4">
            <div class="text-2xl font-bold">{{ stats.conversion.toFixed(1) }}%</div>
            <div class="text-sm text-gray-500">{{ t('photographer.statConversion') }}</div>
          </div>
        </div>

        <NuxtLink to="/photographer/payouts" class="cabinet-row">
          <div class="icon-tile">
            <AppIcon name="wallet" class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-semibold">{{ t('photographer.payoutsTitle') }}</div>
            <div class="text-sm text-gray-500">{{ t('photographer.payoutsHint') }}</div>
          </div>
          <div class="text-right">
            <div class="font-bold text-brand-400">${{ stats.revenue.toFixed(2) }}</div>
          </div>
          <AppIcon name="chevron" class="h-5 w-5 text-gray-500" />
        </NuxtLink>
      </template>
    </div>
  </div>
</template>
