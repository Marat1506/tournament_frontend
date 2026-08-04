<script setup lang="ts">
import type { Tournament } from '~/types'

defineProps<{
  tournament: Tournament
  compact?: boolean
  layout?: 'row' | 'tile'
}>()

const { t, locale } = useI18n()

function formatDate(date?: string) {
  if (!date) return ''
  const loc = locale.value === 'ru' ? 'ru-RU' : locale.value === 'es' ? 'es-ES' : 'en-US'
  return new Date(date).toLocaleDateString(loc, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
</script>

<template>
  <NuxtLink
    v-if="!compact && layout === 'tile'"
    :to="`/tournaments/${tournament.slug}`"
    class="flex h-full flex-col transition active:scale-[0.99]"
  >
    <div class="aspect-square overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
      <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
    </div>
    <h3 class="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">{{ tournament.name }}</h3>
    <p v-if="tournament.location" class="line-clamp-1 text-xs text-gray-500">{{ tournament.location }}</p>
    <p class="mt-1 text-xs font-medium text-brand-600">{{ tournament.photo_count }} {{ t('common.photos') }}</p>
  </NuxtLink>

  <NuxtLink
    v-else-if="!compact"
    :to="`/tournaments/${tournament.slug}`"
    class="card flex h-full gap-3 p-3 transition active:scale-[0.99]"
  >
    <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
      <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
    </div>
    <div class="flex min-w-0 flex-1 flex-col">
      <h3 class="line-clamp-2 min-h-[2.5rem] font-semibold leading-snug">{{ tournament.name }}</h3>
      <p class="mt-1 line-clamp-1 text-sm text-gray-500">{{ formatDate(tournament.date) || ' ' }}</p>
      <p class="line-clamp-1 text-sm text-gray-500">{{ tournament.location || ' ' }}</p>
      <p class="mt-auto pt-1 text-xs font-medium text-brand-600">{{ tournament.photo_count }} {{ t('common.photos') }}</p>
    </div>
  </NuxtLink>

  <div v-else class="card flex h-full gap-3 p-3 transition">
    <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
      <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
    </div>
    <div class="flex min-w-0 flex-1 flex-col">
      <h3 class="line-clamp-2 min-h-[2.5rem] font-semibold leading-snug">{{ tournament.name }}</h3>
      <p class="mt-1 line-clamp-1 text-sm text-gray-500">{{ formatDate(tournament.date) || ' ' }}</p>
      <p class="line-clamp-1 text-sm text-gray-500">{{ tournament.location || ' ' }}</p>
    </div>
  </div>
</template>
