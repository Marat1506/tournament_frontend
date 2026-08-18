<script setup lang="ts">
definePageMeta({ middleware: 'client-auth', ssr: false })

const { t } = useI18n()
const api = useApi()
const router = useRouter()

const route = useRoute()
const filter = ref<'all' | 'purchased' | 'unpurchased' | 'favorites'>('all')
const tournamentId = ref((route.query.tournament_id as string) || '')

const { data, pending } = await useAsyncData(
  () => `profile-photos-${filter.value}-${tournamentId.value}`,
  () => api.getProfilePhotos({
    filter: filter.value === 'all' ? undefined : filter.value,
    tournament_id: tournamentId.value || undefined,
  }),
  { server: false },
)

const { data: tournamentOptions } = await useAsyncData(
  'profile-tournament-options',
  () => api.getProfileTournamentOptions(),
  { server: false },
)

const chips = computed(() => [
  { id: 'all' as const, label: t('profilePhotos.filterAll'), count: data.value?.counts.all },
  { id: 'purchased' as const, label: t('profilePhotos.filterPurchased'), count: data.value?.counts.purchased },
  { id: 'unpurchased' as const, label: t('profilePhotos.filterUnpurchased'), count: data.value?.counts.unpurchased },
  { id: 'favorites' as const, label: t('profilePhotos.filterFavorites'), count: data.value?.counts.favorites },
])

const photos = computed(() => data.value?.data ?? [])
</script>

<template>
  <div class="page-with-floating-cta">
    <AppPageHeader :title="t('profilePhotos.title')">
      <template #left>
        <button class="flex h-10 w-10 items-center justify-center" :aria-label="t('common.back')" @click="router.back()">
          <AppIcon name="back" class="h-5 w-5" />
        </button>
      </template>
      <template #right>
        <button class="flex h-10 w-10 items-center justify-center text-gray-500" :aria-label="t('common.filters')">
          <AppIcon name="filter" class="h-5 w-5" />
        </button>
      </template>
    </AppPageHeader>

    <div class="page-container space-y-4 !pt-0">
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="chip in chips"
          :key="chip.id"
          class="shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition"
          :class="filter === chip.id ? 'chip-active' : 'chip-inactive'"
          @click="filter = chip.id"
        >
          {{ chip.label }}<span v-if="chip.count != null" class="opacity-80"> ({{ chip.count }})</span>
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <select v-model="tournamentId" class="input-field w-auto min-w-[140px] py-2.5 text-sm">
          <option value="">{{ t('profilePhotos.tournament') }}</option>
          <option v-for="tour in tournamentOptions?.data" :key="tour.id" :value="tour.id">{{ tour.name }}</option>
        </select>
      </div>

      <div v-if="pending" class="grid grid-cols-3 gap-1.5">
        <div v-for="n in 9" :key="n" class="aspect-[2/3] animate-pulse rounded-xl bg-white/10" />
      </div>

      <p v-else-if="!photos.length" class="text-center text-sm text-gray-500">
        {{ t('profilePhotos.empty') }}
      </p>

      <div v-else class="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        <ProfilePhotoCard
          v-for="photo in photos"
          :key="photo.id"
          :photo="photo"
        />
      </div>
    </div>

    <div class="floating-above-nav">
      <div class="mx-auto max-w-lg">
        <NuxtLink to="/tournaments" class="btn-primary-solid shadow-lg">
          {{ t('profilePhotos.findNew') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
