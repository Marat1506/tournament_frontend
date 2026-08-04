<script setup lang="ts">
import type { ProfilePhoto } from '~/types'

definePageMeta({ middleware: 'client-auth' })

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
)

const { data: tournamentOptions } = await useAsyncData('profile-tournament-options', () =>
  api.getProfileTournamentOptions(),
)

const chips = computed(() => [
  { id: 'all' as const, label: t('profilePhotos.filterAll'), count: data.value?.counts.all },
  { id: 'purchased' as const, label: t('profilePhotos.filterPurchased'), count: data.value?.counts.purchased },
  { id: 'unpurchased' as const, label: t('profilePhotos.filterUnpurchased'), count: data.value?.counts.unpurchased },
  { id: 'favorites' as const, label: t('profilePhotos.filterFavorites'), count: data.value?.counts.favorites },
])

const photos = computed(() => data.value?.data ?? [])

function asPhotos(list: ProfilePhoto[]) {
  return list as ProfilePhoto[]
}
</script>

<template>
  <div class="pb-28">
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
          <option v-for="t in tournamentOptions?.data" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>

      <PhotoGrid :photos="asPhotos(photos)" :loading="pending" />

      <p v-if="!pending && !photos.length" class="text-center text-sm text-gray-500">
        {{ t('profilePhotos.empty') }}
      </p>
    </div>

    <div class="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 px-4">
      <div class="mx-auto max-w-lg">
        <NuxtLink to="/tournaments" class="btn-primary-solid shadow-lg">
          {{ t('profilePhotos.findNew') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
